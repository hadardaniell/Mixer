import type { OcrProvider } from './ocr.interface.js';

// To activate: set GOOGLE_VISION_API_KEY in apps/ai/.env and enable Cloud Vision API on GCP.
export class GoogleVisionOcrProvider implements OcrProvider {
  private readonly apiKey = process.env.GOOGLE_VISION_API_KEY!;

  async extractText(imageBase64: string, _mimeType: string): Promise<string> {
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requests: [{
            image: { content: imageBase64 },
            features: [{ type: 'TEXT_DETECTION' }],
          }],
        }),
      },
    );

    const data = await response.json() as {
      responses: Array<{ fullTextAnnotation?: { text: string } }>;
    };
    return data.responses[0]?.fullTextAnnotation?.text ?? '';
  }
}
