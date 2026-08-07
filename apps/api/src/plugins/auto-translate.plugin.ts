import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { TranslationService } from '../services/translation.service.js';

export const autoTranslatePlugin = fp(async (app: FastifyInstance) => {
  const translator = new TranslationService(app.collections);

  app.addHook('onSend', async (req: FastifyRequest, reply: FastifyReply, payload: unknown) => {
    // בודקים רק תגובות 200 OK שהן string (JSON)
    if (reply.statusCode !== 200 || typeof payload !== 'string') {
      return payload;
    }

    // זיהוי שפת היעד (לפי Header או ברירת מחדל 'he')
    const targetLang = (req.headers['accept-language']?.startsWith('en') ? 'en' : 'he') as 'he' | 'en';

    try {
      const data = JSON.parse(payload);

      // 1. תרגום אוטומטי למתכונים
      if (req.routerPath?.includes('/recipes') && data?._id && data?.language) {
        if (data.language !== targetLang) {
          const translated = await translator.translateEntity(data, 'recipe', targetLang, {
            title: data.title,
            description: data.description,
            tags: data.tags,
            cuisine: data.cuisine,
            ingredients: data.ingredients,
            steps: data.steps,
          });
          return JSON.stringify(translated);
        }
      }

      // 2. תרגום אוטומטי לספרי מתכונים
      if (req.routerPath?.includes('/recipe-books') && data?._id && data?.language) {
        if (data.language !== targetLang) {
          const translated = await translator.translateEntity(data, 'book', targetLang, {
            name: data.name,
            description: data.description,
          });
          return JSON.stringify(translated);
        }
      }
    } catch (error) {
      app.log.error(error, '[AutoTranslate] Error processing payload');
    }

    return payload;
  });
});