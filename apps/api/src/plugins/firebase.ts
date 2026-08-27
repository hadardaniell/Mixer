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
  // Look for the key file in the current directory and up to 3 parent
  // directories so it works whether cwd is apps/api or the monorepo root.
  const keyFileName = 'firebase-service-account.json';
  let serviceAccountPath = '';
  let dir = process.cwd();
  for (let i = 0; i < 4; i++) {
    const candidate = path.join(dir, keyFileName);
    if (existsSync(candidate)) {
      serviceAccountPath = candidate;
      break;
    }
    const parent = path.dirname(dir);
    if (parent === dir) break; // reached filesystem root
    dir = parent;
  }
  const useKeyFile = serviceAccountPath !== '';

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