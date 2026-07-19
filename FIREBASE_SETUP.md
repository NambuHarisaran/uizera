# Firebase Setup Guide for `uizera`

Your project structure is fully configured for your Firebase project **`uizera`**.

Follow these steps to connect your local environment and deploy security rules.

---

## Step 1: Create `.env.local`

Create a file named `.env.local` in the project root directory and paste the following, replacing the placeholders with credentials from your Firebase Console.

```env
# ── Firebase Client Config (From Firebase Console → Project Settings → Web App) ──
NEXT_PUBLIC_FIREBASE_API_KEY=your-actual-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=uizera.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=uizera
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=uizera.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# ── Firebase Admin Config (From Firebase Console → Project Settings → Service Accounts → Generate new private key) ──
FIREBASE_ADMIN_PROJECT_ID=uizera
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxx@uizera.iam.gserviceaccount.com
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# ── Super Admin Bootstrap ──
# Put your Google account email here to receive super_admin role on first sign-in
SUPER_ADMIN_EMAILS=uizera@psnacet.edu.in,your-email@gmail.com

# ── App URL ──
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Step 2: Enable Firebase Authentication & Firestore

1. **Authentication**: Go to [Firebase Console](https://console.firebase.google.com/) → **Build** → **Authentication** → **Get Started** → Enable **Google** sign-in.
2. **Firestore Database**: Go to **Build** → **Firestore Database** → **Create Database** (Select default production mode and standard region).
3. **Storage**: Go to **Build** → **Storage** → **Get Started**.

---

## Step 3: Deploy Firestore Security Rules & Indexes

Run the deploy command from your terminal:

```bash
npx firebase deploy --only firestore:rules,storage
```

Or run via npm:

```bash
npm run deploy:rules
```

---

## Step 4: Seed Initial Sample Data

Populate initial certification days, sample quizzes, team members, and welcome announcements:

```bash
npm run seed
```

---

## Step 5: Start Local Development

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser!
