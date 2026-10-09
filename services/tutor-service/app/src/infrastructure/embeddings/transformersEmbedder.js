import { pipeline, env } from '@huggingface/transformers';
import { EmbeddingUnavailableError } from '../../domain/errors/index.js';

/**
 * Local embeddings, no external API: intfloat/multilingual-e5-small (384 dims) run with ONNX Runtime on CPU.
 * e5 needs a prefix: "passage: " for stored text (the tutor profile), "query: " for what the user searches.
 * Vectors are mean-pooled and L2-normalized, like the sentence-transformers pipeline of the Python service.
 */
export class TransformersEmbedder {
  #model;
  #cacheDir;
  #dimensions;
  #extractor = null; // Promise, created lazily and shared

  constructor({ model, cacheDir, dimensions }) {
    this.#model = model;
    this.#cacheDir = cacheDir;
    this.#dimensions = dimensions;
  }

  #load() {
    if (!this.#extractor) {
      env.cacheDir = this.#cacheDir;
      this.#extractor = pipeline('feature-extraction', this.#model, { dtype: 'fp32' }).catch((err) => {
        this.#extractor = null; // allow a retry on the next call
        throw new EmbeddingUnavailableError(err);
      });
    }
    return this.#extractor;
  }

  /** Starts loading the model (downloads it the first time). Resolves when it is ready. */
  async warmUp() {
    await this.#load();
  }

  async #embed(text) {
    const extractor = await this.#load();
    try {
      const output = await extractor(text, { pooling: 'mean', normalize: true });
      const vector = Array.from(output.data);
      if (vector.length !== this.#dimensions) {
        throw new Error(`expected ${this.#dimensions} dimensions, got ${vector.length}`);
      }
      return vector;
    } catch (err) {
      throw err instanceof EmbeddingUnavailableError ? err : new EmbeddingUnavailableError(err);
    }
  }

  /** Embedding of stored text (a profile). Null for empty text. */
  async embedPassage(text) {
    if (!text) return null;
    return this.#embed(`passage: ${text}`);
  }

  /** Embedding of a search. Null for blank text. */
  async embedQuery(text) {
    if (!text || !text.trim()) return null;
    return this.#embed(`query: ${text.trim()}`);
  }
}
