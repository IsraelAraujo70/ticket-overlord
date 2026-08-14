import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../../../config/environment';
import { EmbeddingProvider } from '../../application/ports/embedding-provider';

const OPENROUTER_EMBEDDINGS_URL = 'https://openrouter.ai/api/v1/embeddings';

@Injectable()
export class OpenRouterEmbeddingProvider extends EmbeddingProvider {
  readonly model: string;
  readonly dimensions = 1536;
  private readonly apiKey: string | undefined;

  constructor(config: ConfigService<EnvironmentVariables, true>) {
    super();
    this.apiKey = config.get('OPENROUTER_API_KEY', { infer: true });
    this.model = config.get('OPENROUTER_EMBEDDING_MODEL', { infer: true });
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey);
  }

  async embedQuery(query: string): Promise<readonly number[]> {
    const [embedding] = await this.embed([query], 'query');
    if (!embedding) throw new Error('Embedding provider returned no result.');
    return embedding;
  }

  embedDocuments(documents: readonly string[]): Promise<readonly number[][]> {
    return this.embed(documents, 'document');
  }

  private async embed(
    inputs: readonly string[],
    inputType: 'query' | 'document',
  ): Promise<readonly number[][]> {
    if (!this.apiKey) {
      throw new Error('OPENROUTER_API_KEY is not configured.');
    }

    const response = await fetch(OPENROUTER_EMBEDDINGS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: this.model,
        input: inputs,
        input_type: inputType,
        dimensions: this.dimensions,
      }),
      signal: AbortSignal.timeout(inputType === 'query' ? 2_500 : 30_000),
    });

    if (!response.ok) {
      throw new Error(`OpenRouter embeddings failed with ${response.status}.`);
    }

    const payload: unknown = await response.json();
    const embeddings = parseEmbeddings(payload, this.dimensions);
    if (embeddings.length !== inputs.length) {
      throw new Error('OpenRouter returned an unexpected embedding count.');
    }
    return embeddings;
  }
}

function parseEmbeddings(
  payload: unknown,
  dimensions: number,
): readonly number[][] {
  if (!isRecord(payload) || !Array.isArray(payload.data)) {
    throw new Error('OpenRouter returned an invalid embeddings payload.');
  }

  return payload.data
    .map((item) => {
      if (
        !isRecord(item) ||
        typeof item.index !== 'number' ||
        !Array.isArray(item.embedding) ||
        item.embedding.length !== dimensions ||
        !item.embedding.every(
          (value): value is number =>
            typeof value === 'number' && Number.isFinite(value),
        )
      ) {
        throw new Error('OpenRouter returned an invalid embedding vector.');
      }
      return { index: item.index, embedding: item.embedding };
    })
    .sort((left, right) => left.index - right.index)
    .map((item) => item.embedding);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
