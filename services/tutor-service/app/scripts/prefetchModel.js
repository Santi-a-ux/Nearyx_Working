/**
 * Build-time step (see Dockerfile.render): downloads the embedding model into the image so the service does not
 * download ~100-470 MB on every cold start. Does not need DATABASE_URL.
 */
import path from 'node:path';
import { pipeline, env } from '@huggingface/transformers';

const model = process.env.EMBEDDING_MODEL ?? 'Xenova/multilingual-e5-small';
const dtype = process.env.EMBEDDING_DTYPE ?? 'fp32';
env.cacheDir = path.resolve(process.env.MODEL_CACHE_DIR ?? '.cache/models');

await pipeline('feature-extraction', model, { dtype });
console.log(`Model ${model} (${dtype}) cached in ${env.cacheDir}`);
