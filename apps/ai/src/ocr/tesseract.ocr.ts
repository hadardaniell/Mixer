import Tesseract from 'tesseract.js';
import type { OcrProvider } from './ocr.interface.js';

export class TesseractOcrProvider implements OcrProvider {
  async extractText(imageBase64: string, mimeType: string): Promise<string> {
    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const result = await Tesseract.recognize(imageBuffer, 'heb+eng', {
      logger: () => {},
    });
    return result.data.text;
  }
}
