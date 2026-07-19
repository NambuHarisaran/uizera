/**
 * Read-only diagnostic: verify auth account, custom claims, and Firestore
 * role for an email.
 *
 * Usage:
 *   npx tsx scripts/check-admin.ts <email>
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getAuth } from "firebase-admin/auth";
import * as fs from "node:fs";
import * as path from "node:path";

function loadEnv() {
  const envPath = path.resolve(process.cwd(), ".env.local");
  if (fs.existsSync(envPath)) {
    const content = fs.readFileSync(envPath, "utf8");
    for (const line of content.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const idx = trimmed.indexOf("=");
      if (idx !== -1) {
        const key = trimmed.slice(0, idx).trim();
        let val = trimmed.slice(idx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        if (!process.env[key]) process.env[key] = val;
      }
    }
  }
}

loadEnv();

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("❌ Missing FIREBASE_ADMIN_* env vars in .env.local");
  process.exit(1);
}

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error("Usage: npx tsx scripts/check-admin.ts <email>");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  console.log(`🔎 Checking ${email} in project ${projectId}\n`);

  const authUser = await auth.getUserByEmail(email).catch(() => null);
  if (!authUser) {
    console.log("Auth account: ❌ NOT FOUND — this email has never signed in.");
    return;
  }
  console.log(`Auth account: ✅ uid=${authUser.uid}`);
  console.log(`Custom claims: ${JSON.stringify(authUser.customClaims ?? {})}`);

  const snap = await db.collection("users").doc(authUser.uid).get();
  if (!snap.exists) {
    console.log("Firestore users doc: ❌ NOT FOUND");
    return;
  }
  const data = snap.data()!;
  console.log(`Firestore role: ${data.role}`);
  console.log(`Disabled: ${data.disabled}`);
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
