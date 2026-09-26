import type {
  StudentUser,
  LoginCredentials,
  SignUpPayload,
  BackendSignupResponse,
  BackendLoginResponse,
  BackendMeResponse,
} from '@/types/auth';
import { apiClient } from '@/services/api/apiClient';
import { auth, isFirebaseClientConfigured, signInWithCustomToken, signInWithEmailAndPassword, signOut } from '@/lib/firebase';

const TOKEN_KEY = 'student_access_token';
const USER_KEY = 'student_user_profile';

export class AuthService {
  /**
   * Register a new student user via the Express backend + Firebase Admin SDK.
   * Never falls back to fake/mock tokens.
   */
  async signUp(payload: SignUpPayload): Promise<StudentUser> {
    if (!payload.firstName || !payload.firstName.trim()) {
      throw new Error('First name is required.');
    }
    if (!payload.email || !payload.email.includes('@')) {
      throw new Error('A valid student email address is required.');
    }
    if (!payload.password || payload.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    const response = await apiClient.post<BackendSignupResponse>('/auth/signup', {
      email: payload.email.trim(),
      password: payload.password,
      firstName: payload.firstName.trim(),
      lastName: payload.lastName?.trim() || '',
      learningGoal: payload.learningGoal || payload.primaryGoal || '',
    });

    const resPayload = response.data || (response as unknown as BackendSignupResponse);
    const backendUser = resPayload.user;
    let idToken = resPayload.customToken || '';

    // If Firebase Client SDK is available and a custom token was generated, authenticate client session
    if (isFirebaseClientConfigured && auth && resPayload.customToken) {
      try {
        const userCredential = await signInWithCustomToken(auth, resPayload.customToken);
        idToken = await userCredential.user.getIdToken();
      } catch (err) {
        console.warn('[AuthService] Firebase client custom token sign-in failed, proceeding with server token.', err);
      }
    }

    const studentUser: StudentUser = {
      uid: backendUser.uid,
      id: backendUser.uid,
      email: backendUser.email,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      learningGoal: backendUser.learningGoal || '',
      primaryGoal: backendUser.learningGoal || '',
      createdAt: backendUser.createdAt,
    };

    if (idToken) {
      this.saveSession(idToken, studentUser);
    } else {
      localStorage.setItem(USER_KEY, JSON.stringify(studentUser));
    }

    return studentUser;
  }

  /**
   * Authenticate a student user via Firebase Authentication or Backend Login API.
   * Never falls back to fake/mock tokens.
   */
  async login(credentials: LoginCredentials): Promise<StudentUser> {
    if (!credentials.email || !credentials.email.includes('@')) {
      throw new Error('Please enter a valid student email address.');
    }
    if (!credentials.password || credentials.password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    let idToken = '';
    let studentUser: StudentUser | null = null;

    // 1. Try Firebase Client SDK authentication if configured on client
    if (isFirebaseClientConfigured && auth) {
      const userCredential = await signInWithEmailAndPassword(auth, credentials.email.trim(), credentials.password);
      idToken = await userCredential.user.getIdToken();
      this.saveToken(idToken);

      try {
        studentUser = await this.syncProfile();
      } catch {
        const fbUser = userCredential.user;
        const nameParts = (fbUser.displayName || '').split(' ');
        studentUser = {
          uid: fbUser.uid,
          id: fbUser.uid,
          email: fbUser.email || credentials.email,
          firstName: nameParts[0] || credentials.email.split('@')[0],
          lastName: nameParts.slice(1).join(' ') || '',
          createdAt: new Date().toISOString(),
        };
        this.saveSession(idToken, studentUser);
      }
      return studentUser;
    }

    // 2. Otherwise call backend POST /auth/login
    const response = await apiClient.post<BackendLoginResponse>('/auth/login', credentials);
    const resPayload = response.data || (response as unknown as BackendLoginResponse);

    idToken = resPayload.tokens?.accessToken || (resPayload as any).customToken || '';
    const backendUser = resPayload.user;

    studentUser = {
      uid: backendUser.uid,
      id: backendUser.uid,
      email: backendUser.email,
      firstName: backendUser.firstName,
      lastName: backendUser.lastName,
      learningGoal: backendUser.learningGoal || '',
      primaryGoal: backendUser.learningGoal || '',
      createdAt: backendUser.createdAt,
    };

    this.saveSession(idToken, studentUser);
    return studentUser;
  }

  /**
   * Retrieve student profile from backend GET /api/v1/auth/me
   */
  async syncProfile(): Promise<StudentUser> {
    const response = await apiClient.get<BackendMeResponse>('/auth/me');
    const resPayload = response.data || (response as unknown as BackendMeResponse);
    const u = resPayload.user;

    const studentUser: StudentUser = {
      uid: u.uid,
      id: u.uid,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      learningGoal: u.learningGoal || '',
      primaryGoal: u.learningGoal || '',
      createdAt: u.createdAt,
    };
    const currentToken = localStorage.getItem(TOKEN_KEY) || '';
    this.saveSession(currentToken, studentUser);
    return studentUser;
  }

  /**
   * Update student profile via backend PATCH /api/v1/auth/me
   */
  async updateProfile(updates: Partial<StudentUser>): Promise<StudentUser> {
    const response = await apiClient.patch<BackendMeResponse, Partial<StudentUser>>('/auth/me', updates);
    const resPayload = response.data || (response as unknown as BackendMeResponse);
    const u = resPayload.user;

    const updated: StudentUser = {
      uid: u.uid,
      id: u.uid,
      email: u.email,
      firstName: u.firstName,
      lastName: u.lastName,
      learningGoal: u.learningGoal || '',
      primaryGoal: u.learningGoal || '',
      createdAt: u.createdAt,
    };
    const currentToken = localStorage.getItem(TOKEN_KEY) || '';
    this.saveSession(currentToken, updated);
    return updated;
  }

  /**
   * Sign out student from Firebase Auth and clear local session state
   */
  async logout(): Promise<void> {
    if (isFirebaseClientConfigured && auth) {
      try {
        await signOut(auth);
      } catch (err) {
        console.warn('[AuthService] Error signing out from Firebase Auth:', err);
      }
    }
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  getCurrentUser(): StudentUser | null {
    const rawUser = localStorage.getItem(USER_KEY);
    if (!rawUser) return null;
    try {
      return JSON.parse(rawUser) as StudentUser;
    } catch {
      this.logout();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return Boolean(localStorage.getItem(TOKEN_KEY) && this.getCurrentUser());
  }

  private saveToken(token: string): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  }

  private saveSession(token: string, user: StudentUser): void {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export const authService = new AuthService();
