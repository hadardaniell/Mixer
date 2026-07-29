// apps/api/src/plugins/firebase.ts
import { existsSync } from 'node:fs';
import * as path from 'path';
import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import { Storage, Bucket } from '@google-cloud/storage';

declare module 'fastify' {
  interface FastifyInstance {
    firebaseBucket: Bucket;
  }
}

async function firebasePlugin(fastify: FastifyInstance) {
  // Locally we authenticate with the downloaded service-account key file. On
  // Cloud Run there's no key file — the service runs as a GCP service account
  // with Storage access, so we fall back to Application Default Credentials.
  const serviceAccountPath = path.join(process.cwd(), 'firebase-service-account.json');
  const useKeyFile = existsSync(serviceAccountPath);

  const storage = new Storage({
    projectId: process.env.FIREBASE_PROJECT_ID,
    ...(useKeyFile ? { keyFilename: serviceAccountPath } : {}),
  });

  const bucket = storage.bucket(`${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`);

  fastify.decorate('firebaseBucket', bucket);

  fastify.log.info(
    `Firebase Storage initialized (${useKeyFile ? 'service-account key' : 'application default credentials'})`,
  );
}

export default fp(firebasePlugin);