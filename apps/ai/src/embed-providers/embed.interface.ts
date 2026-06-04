export interface EmbedProvider {
  embed(text: string): Promise<number[]>;
}
