// apps/api/src/plugins/firebase.ts
import fp from 'fastify-plugin';
import admin from 'firebase-admin';
import type { FastifyPluginAsync } from 'fastify';

// שולפים את הטיפוס המדויק של אובייקט ה-Storage מתוך ה-SDK של Firebase
type FirebaseStorage = ReturnType<typeof admin.storage>;
// שולפים את הטיפוס המדויק של ה-Bucket מתוכו
type FirebaseBucket = ReturnType<FirebaseStorage['bucket']>;

declare module 'fastify' {
  interface FastifyInstance {
    storageBucket: FirebaseBucket; // עכשיו הטיפוס פה תואם ב-100% למה שיוצא מהפונקציה למטה
  }
}

const firebasePlugin: FastifyPluginAsync = async (app) => {
  if (admin.apps.length === 0) {
    admin.initializeApp({
      storageBucket: 'YOUR_PROJECT_ID.firebasestorage.app', 
    });
  }

  const bucket = admin.storage().bucket();

  // עכשיו TypeScript יקבל את זה בשמחה ובלי תלונות
  app.decorate('storageBucket', bucket);
};

export default fp(firebasePlugin, { name: 'firebase' });