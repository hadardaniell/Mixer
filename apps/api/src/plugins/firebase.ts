// apps/api/src/plugins/firebase.ts
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Storage, Bucket } from '@google-cloud/storage';
import * as path from 'path';

declare module 'fastify' {
  interface FastifyInstance {
    firebaseBucket: Bucket;
  }
}

async function firebasePlugin(fastify: FastifyInstance) {
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');

  const storage = new Storage({
    keyFilename: serviceAccountPath,
    projectId: process.env.FIREBASE_PROJECT_ID 
  });

  const bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`);

  fastify.decorate('firebaseBucket', bucket);
  
  fastify.log.info('Firebase Storage initialized successfully for Mixer Personal Project');
}

export default fp(firebasePlugin);