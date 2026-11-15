import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";
import { getMessaging } from "firebase-admin/messaging";

const APP_NAME = "eventsnap-vercel-api";

export function getAdminServices() {
  const rawAccount = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!rawAccount) throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not configured.");

  const account = JSON.parse(rawAccount);
  const projectId = process.env.FIREBASE_PROJECT_ID || account.project_id || account.projectId;
  const clientEmail = account.client_email || account.clientEmail;
  const privateKey = account.private_key || account.privateKey;
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("The Firebase service account is missing required fields.");
  }
  if ((account.project_id || account.projectId) !== projectId) {
    throw new Error("FIREBASE_PROJECT_ID does not match the Firebase service account.");
  }

  const app = getApps().find((candidate) => candidate.name === APP_NAME)
    || initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    }, APP_NAME);

  return {
    auth: getAuth(app),
    db: getFirestore(app),
    messaging: getMessaging(app),
  };
}
