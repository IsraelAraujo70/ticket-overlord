export abstract class EmbeddingProvider {
  abstract readonly model: string;
  abstract readonly dimensions: number;
  abstract isConfigured(): boolean;
  abstract embedQuery(query: string): Promise<readonly number[]>;
  abstract embedDocuments(
    documents: readonly string[],
  ): Promise<readonly number[][]>;
}
