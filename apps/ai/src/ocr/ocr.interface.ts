export interface OcrProvider {
  extractText(imageBase64: string, mimeType: string): Promise<string>;
}
