import type { Request, Response, NextFunction } from 'express';
import { auth, db, isFirebaseConfigured } from '../config/firebase.js';
import type { UserDocument, StudentProfileDocument } from '../types/firestore.js';

/**
 * Helper to validate email format
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * POST /api/v1/auth/signup
 * Creates a Firebase Authentication user and corresponding Firestore student profile.
 */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password, firstName, lastName, learningGoal, primaryGoal } = req.body || {};

    if (!email || typeof email !== 'string' || !isValidEmail(email.trim())) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'A valid student email address is required.',
        },
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Password must be at least 6 characters long.',
        },
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!firstName || typeof firstName !== 'string' || !firstName.trim()) {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'First name is required.',
        },
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!isFirebaseConfigured() || !auth || !db) {
      res.status(503).json({
        error: {
          code: 'FIREBASE_UNCONFIGURED',
          message: 'Firebase Admin SDK is not configured on the backend server.',
        },
        status: 503,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanFirstName = firstName.trim();
    const cleanLastName = typeof lastName === 'string' ? lastName.trim() : '';
    const cleanGoal = typeof learningGoal === 'string' ? learningGoal.trim() : (typeof primaryGoal === 'string' ? primaryGoal.trim() : '');

    // 1. Create user in Firebase Authentication (Password stored ONLY in Firebase Auth)
    let userRecord;
    try {
      userRecord = await auth.createUser({
        email: cleanEmail,
        password,
        displayName: `${cleanFirstName} ${cleanLastName}`.trim(),
      });
    } catch (authErr: any) {
      if (authErr.code === 'auth/email-already-exists') {
        res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists.',
          },
          status: 409,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      throw authErr;
    }

    const uid = userRecord.uid;
    const nowIso = new Date().toISOString();

    // 2. Create Firestore records (users/{uid} and studentProfiles/{uid}) - NO PASSWORDS STORED
    const userDoc: UserDocument = {
      uid,
      email: cleanEmail,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const profileDoc: StudentProfileDocument = {
      uid,
      firstName: cleanFirstName,
      lastName: cleanLastName,
      learningGoal: cleanGoal,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    const batch = db.batch();
    batch.set(db.collection('users').doc(uid), userDoc);
    batch.set(db.collection('studentProfiles').doc(uid), profileDoc);
    await batch.commit();

    // 3. Generate Custom Token for client session initialization if needed
    const customToken = await auth.createCustomToken(uid);

    res.status(201).json({
      message: 'Account created successfully',
      user: {
        uid,
        email: cleanEmail,
        firstName: cleanFirstName,
        lastName: cleanLastName,
        learningGoal: cleanGoal,
        createdAt: nowIso,
      },
      customToken,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/v1/auth/login
 * Validates credentials and returns authenticated user profile + token via Firebase Admin SDK.
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email, password } = req.body || {};

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({
        error: {
          code: 'INVALID_INPUT',
          message: 'Both email and password are required.',
        },
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!isFirebaseConfigured() || !auth || !db) {
      res.status(503).json({
        error: {
          code: 'FIREBASE_UNCONFIGURED',
          message: 'Firebase Admin SDK is not configured on the backend server.',
        },
        status: 503,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const cleanEmail = email.trim().toLowerCase();

    // 1. Fetch user record from Firebase Auth using Firebase Admin SDK
    let userRecord;
    try {
      userRecord = await auth.getUserByEmail(cleanEmail);
    } catch (authErr: any) {
      if (authErr.code === 'auth/user-not-found') {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid student email address or password.',
          },
          status: 401,
          timestamp: new Date().toISOString(),
        });
        return;
      }
      throw authErr;
    }

    const uid = userRecord.uid;

    // 2. Generate Firebase Auth custom token using Admin SDK
    const customToken = await auth.createCustomToken(uid);

    // 3. Retrieve Student Profile from Firestore
    const profileSnap = await db.collection('studentProfiles').doc(uid).get();
    const profileData = profileSnap.exists ? profileSnap.data() : {};

    res.status(200).json({
      message: 'Login successful',
      user: {
        uid,
        email: userRecord.email || cleanEmail,
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        learningGoal: profileData?.learningGoal || '',
        createdAt: profileData?.createdAt || new Date().toISOString(),
      },
      tokens: {
        accessToken: customToken,
        expiresIn: 3600,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/v1/auth/me
 * Retrieves the authenticated student's profile from Firestore.
 */
export async function getMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user UID not found in request context.',
        },
        status: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!isFirebaseConfigured() || !db) {
      res.status(503).json({
        error: {
          code: 'FIREBASE_UNCONFIGURED',
          message: 'Firebase Admin SDK is not configured on the backend server.',
        },
        status: 503,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const [userSnap, profileSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      db.collection('studentProfiles').doc(uid).get(),
    ]);

    if (!userSnap.exists && !profileSnap.exists) {
      res.status(404).json({
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Authenticated student profile was not found in Firestore.',
        },
        status: 404,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const userData = userSnap.exists ? userSnap.data() : {};
    const profileData = profileSnap.exists ? profileSnap.data() : {};

    res.status(200).json({
      user: {
        uid,
        email: req.user?.email || userData?.email || '',
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        learningGoal: profileData?.learningGoal || '',
        createdAt: profileData?.createdAt || userData?.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /api/v1/auth/me
 * Updates the authenticated student's own profile in Firestore.
 */
export async function updateMe(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const uid = req.user?.uid;

    if (!uid) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authenticated user UID not found in request context.',
        },
        status: 401,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!isFirebaseConfigured() || !db) {
      res.status(503).json({
        error: {
          code: 'FIREBASE_UNCONFIGURED',
          message: 'Firebase Admin SDK is not configured on the backend server.',
        },
        status: 503,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { firstName, lastName, learningGoal, primaryGoal } = req.body || {};

    const updateFields: Record<string, any> = {
      updatedAt: new Date().toISOString(),
    };

    let hasUpdates = false;

    if (typeof firstName === 'string' && firstName.trim()) {
      updateFields.firstName = firstName.trim();
      hasUpdates = true;
    }
    if (typeof lastName === 'string') {
      updateFields.lastName = lastName.trim();
      hasUpdates = true;
    }
    const goalVal = typeof learningGoal === 'string' ? learningGoal : (typeof primaryGoal === 'string' ? primaryGoal : null);
    if (goalVal !== null) {
      updateFields.learningGoal = goalVal.trim();
      hasUpdates = true;
    }

    if (!hasUpdates) {
      res.status(400).json({
        error: {
          code: 'NO_UPDATES_PROVIDED',
          message: 'At least one valid field (firstName, lastName, learningGoal) must be provided to update profile.',
        },
        status: 400,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profileRef = db.collection('studentProfiles').doc(uid);
    await profileRef.set(updateFields, { merge: true });

    // Fetch updated profile
    const [userSnap, profileSnap] = await Promise.all([
      db.collection('users').doc(uid).get(),
      profileRef.get(),
    ]);

    const userData = userSnap.exists ? userSnap.data() : {};
    const profileData = profileSnap.exists ? profileSnap.data() : {};

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        uid,
        email: req.user?.email || userData?.email || '',
        firstName: profileData?.firstName || '',
        lastName: profileData?.lastName || '',
        learningGoal: profileData?.learningGoal || '',
        createdAt: profileData?.createdAt || userData?.createdAt || new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
}
