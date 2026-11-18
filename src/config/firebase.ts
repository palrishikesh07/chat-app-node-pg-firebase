import path from "path";

import {
    cert,
    getApps,
    initializeApp
} from "firebase-admin/app";

import { getFirestore } from "firebase-admin/firestore";

const credentialPath = path.resolve(process.cwd(), "serviceAccountKey.json");
const serviceAccount = require(credentialPath);

const firebaseApp = getApps().length
    ? getApps()[0]
    : initializeApp({
        credential: cert(serviceAccount),
        projectId: serviceAccount.project_id
    });

export const firestore = getFirestore(firebaseApp);
