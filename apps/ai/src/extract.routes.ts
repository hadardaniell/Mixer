import type { FastifyInstance } from 'fastify';
import { downloadService } from './download.service.js';
import { videoLlamaService } from './videoLlama.service.js';
import { textLlamaService } from './textLlama.service.js';
import fs from 'node:fs/promises';
import path from 'node:path';

export async function extractRoutes(app: FastifyInstance) {
  app.post('/extract/text', async (req, reply) => {
    const { text } = req.body as { text: string };
    try {
      const recipe = await textLlamaService.extractRecipeFromText(text);
      return reply.code(200).send(recipe || { title: null });
    } catch (err) {
      app.log.error(err, 'Text extraction failed');
      return reply.code(500).send({ error: 'Failed to process text in AI service', details: err instanceof Error ? err.message : String(err) });
    }
  });

  app.post('/extract/video', async (req, reply) => {
    const { url } = req.body as { url: string };
    
    let tempDirectory = '';
    try {
      app.log.info({ url }, 'Attempting to extract recipe from video comments...');
      const commentsText = await downloadService.getTopComments(url);
      
      if (commentsText) {
        console.log('\n--- TOP COMMENTS ---');
        console.log(commentsText);
        console.log('--------------------\n');
      }

      if (commentsText.trim()) {
        app.log.info('Analyzing top 2 comments for a recipe...');
        const textRecipe = await textLlamaService.extractRecipeFromText(commentsText);
        
        if (textRecipe) {
          app.log.info('Successfully extracted recipe from comments.');
          return reply.code(200).send({ ...textRecipe, source: 'comments' });
        }
        app.log.info('No complete recipe found in comments. Falling back to video processing.');
      } else {
        app.log.info('No comments found or failed to extract. Proceeding to video processing.');
      }

      // 2. Download the video and extract sparse frames & audio
      const { tempDir, audioPath, framePaths } = await downloadService.downloadAndExtractFrames(url);
      tempDirectory = tempDir;
      app.log.info({ tempDir, frames: framePaths.length }, 'Video downloaded and frames extracted');

      // 3. Have Gemini watch the frames + audio and output JSON
      const recipeData = await videoLlamaService.extractRecipe(audioPath, framePaths);
      
      return reply.code(200).send({ ...recipeData, source: 'video' });
    } catch (err) {
      app.log.error(err, 'Extraction failed');
      return reply.code(500).send({ error: 'Failed to process video in AI service', details: err instanceof Error ? err.message : String(err) });
    } finally {
      if (tempDirectory) {
        await fs.rm(tempDirectory, { recursive: true, force: true }).catch(() => {});
      }
    }
  });
}