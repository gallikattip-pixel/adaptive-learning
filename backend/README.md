# Adaptive Learning Backend Service (Stage 1 Foundation)

Node.js + Express + TypeScript + Firebase Admin SDK backend foundation for the Adaptive Learning student platform.

---

## 1. Requirements
- **Node.js**: v18.0.0+ (v24+ recommended)
- **NPM**: v9.0.0+
- **Firebase Project**: Firebase project with Cloud Firestore & Firebase Authentication enabled.

---

## 2. Firebase Setup & Credentials
1. Create a Firebase project in the [Firebase Console](https://console.firebase.google.com/).
2. Enable **Firebase Authentication** (Email/Password provider).
3. Enable **Cloud Firestore** in Native mode.
4. Navigate to **Project Settings > Service Accounts**.
5. Click **Generate New Private Key** to download your JSON service account file.

---

## 3. Environment Variables
Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example .env
```

Populate the following variables with your Firebase Service Account credentials:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"

PORT=5000
NODE_ENV=development
CORS_ORIGIN=http://localhost:5173
```

> **IMPORTANT SECURITY NOTICE:**
> Never commit `.env` or expose `FIREBASE_PRIVATE_KEY` to git or to the frontend browser application.

---

## 4. Security Architecture
```text
React + Vite Frontend (Port 5173)
        ↓ (HTTP Bearer Token)
Node.js + Express Backend (Port 5000)
        ↓ (Firebase Admin SDK)
Firebase Auth + Cloud Firestore
```
- Client browsers do **NOT** receive Firebase Admin credentials.
- CORS is locked down to `CORS_ORIGIN` (default `http://localhost:5173`).
- Security middleware enforced: `helmet`, request body size limit (10MB), and centralized error handling.

---

## 5. Development & Build Commands

### Install Dependencies
```bash
npm install
```

### Run Development Server (with hot reloading)
```bash
npm run dev
```

### Build Production Code
```bash
npm run build
```

### Run Production Server
```bash
npm start
```

---

## 6. Health Check Endpoint

```http
GET http://localhost:5000/health
```

**Response:**
```json
{
  "status": "ok"
}
```
