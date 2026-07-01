import type { Document } from 'mongodb';

/**
 * One collection's `$jsonSchema` validator plus its enforcement settings, as
 * accepted by `collMod` / `createCollection`.
 */
export type CollectionValidator = {
  validator: Document;
  validationLevel: 'off' | 'moderate' | 'strict';
  validationAction: 'warn' | 'error';
};
