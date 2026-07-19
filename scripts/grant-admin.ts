/**
 * Grant super_admin role to a user by email — updates the Firestore user doc
 * and sets the Firebase Auth custom claim.
 *
 * Usage:
 *   npx tsx scripts/grant-admin.ts <email>
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
        if (!process.env[key]) {
          process.env[key] = val;
        }
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
  console.error("Usage: npx tsx scripts/grant-admin.ts <email>");
  process.exit(1);
}

const app = getApps()[0] ?? initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
const db = getFirestore(app);
const auth = getAuth(app);

async function run() {
  console.log(`🔑 Granting super_admin to ${email} in project ${projectId}...`);

  // Prefer the Auth record — works even if the Firestore doc is missing.
  const authUser = await auth.getUserByEmail(email).catch(() => null);

  if (!authUser) {
    console.log(
      "⚠️  No Firebase Auth account found for this email yet.\n" +
        "    They are covered by SUPER_ADMIN_EMAILS in .env.local, so the role\n" +
        "    will be applied automatically on their first Google sign-in."
    );
    return;
  }

  await auth.setCustomUserClaims(authUser.uid, { role: "super_admin" });

  const userRef = db.collection("users").doc(authUser.uid);
  const snap = await userRef.get();
  if (snap.exists) {
    await userRef.update({ role: "super_admin" });
    console.log(`✅ Updated users/${authUser.uid} role → super_admin and set custom claim.`);
  } else {
    console.log(
      `✅ Set custom claim for uid ${authUser.uid}. Firestore profile will be\n` +
        "   provisioned with super_admin on next sign-in (SUPER_ADMIN_EMAILS)."
    );
  }
  console.log("ℹ️  The user must sign out and back in for the new claim to load.");
}

run().catch((err) => {
  console.error("❌ Failed:", err);
  process.exit(1);
});
