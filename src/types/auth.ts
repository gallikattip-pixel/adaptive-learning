export interface StudentUser {
  uid: string;
  id?: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
  learningGoal?: string;
  primaryGoal?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface LoginCredentials {
  email: string;
  password?: string;
}

export interface SignUpPayload {
  firstName: string;
  lastName?: string;
  email: string;
  password?: string;
  learningGoal?: string;
  primaryGoal?: string;
}

export interface BackendSignupResponse {
  message: string;
  user: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    learningGoal?: string;
    createdAt: string;
  };
  customToken?: string;
}

export interface BackendLoginResponse {
  message: string;
  user: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    learningGoal?: string;
    createdAt: string;
  };
  tokens: AuthTokens;
}

export interface BackendMeResponse {
  user: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    learningGoal?: string;
    createdAt: string;
  };
}

export interface AuthResponse {
  user: StudentUser;
  tokens?: AuthTokens;
}

export interface AuthState {
  user: StudentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}
