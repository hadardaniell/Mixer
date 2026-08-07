//apps/api/src/modules/recipe-books/recipe-books.translation.ts
import { ObjectId } from 'mongodb';
import { config } from '../../config.js';
import type { RecipeBookDoc, BookTranslationDoc } from '../../db/types.js';

export async function translateBookIfNeeded(
  app: any,
  book: RecipeBookDoc,
  targetLang: 'he' | 'en',
): Promise<RecipeBookDoc> {

  if (!book.language || book.language === targetLang) {
    return book;
  }

  const cached = await app.collections.bookTranslations?.findOne({
    bookId: book._id,
    language: targetLang,
  });

  if (cached) {
    return {
      ...book,
      name: cached.name,
      description: cached.description,
      language: targetLang,
    };
  }


  try {
    const response = await fetch(`${config.aiBaseUrl}/translate/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        book: {
          name: book.name,
          description: book.description,
        },
        targetLanguage: targetLang,
      }),
    });


    if (!response.ok) {
      return book;
    }


    const translated = await response.json() as {
      name: string;
      description?: string;
    };


    await app.collections.bookTranslations?.insertOne({
      _id: new ObjectId(),
      bookId: book._id,
      language: targetLang,
      name: translated.name,
      description: translated.description,
      createdAt: new Date(),
    });


    return {
      ...book,
      name: translated.name,
      description: translated.description,
      language: targetLang,
    };


  } catch {
    return book;
  }
}