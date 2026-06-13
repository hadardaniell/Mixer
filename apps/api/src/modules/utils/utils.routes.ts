import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod';
import { z } from 'zod';
import { UtilsService } from './utils.service.js';

export const utilsRoutes: FastifyPluginAsyncZod = async (fastify) => {
  const utilsService = new UtilsService();

  fastify.post(
    '/convert',
    {
      schema: {
        tags: ['utils'],
        summary: 'Convert ingredient units',
        description: 'Converts ingredient amounts from one unit to another (e.g., cups to grams).',
        body: z.object({
          ingredient: z.string().min(1, 'Ingredient is required'),
          amount: z.number().positive('Amount must be positive'),
          fromUnit: z.string().min(1, 'Source unit is required'),
          toUnit: z.string().optional(),
        }),
        response: {
          200: z.object({
            ingredient: z.string(),
            originalAmount: z.number(),
            originalUnit: z.string(),
            convertedAmount: z.number(),
            targetUnit: z.string(),
          }),
          400: z.object({ error: z.string() }),
          500: z.object({ error: z.string() }),
        },
      },
    },
    async (request, reply) => {
      try {
        const { ingredient, amount, fromUnit, toUnit } = request.body;

        const { result, message } = utilsService.convertUnit(ingredient, amount, fromUnit, toUnit);

        if (result === null) {
          return reply.status(400).send({ error: message });
        }

        return reply.code(200).send({
          ingredient,
          originalAmount: amount,
          originalUnit: fromUnit,
          convertedAmount: result,
          targetUnit: toUnit || 'גרם',
        });
      } catch (error) {
        fastify.log.error(error, 'Error converting units');
        return reply.status(500).send({ error: 'Internal Server Error' });
      }
    }
  );
};