/**
 * Migration check: the embeddings stored by the Python service (sentence-transformers) and the ones this service
 * computes (ONNX / transformers.js) must be the same vectors. Prints the cosine similarity per profile and exits
 * with code 1 if any is below 0.99.
 * Usage:  npm run verify:embeddings [-- <max profiles, default 20>]
 */
import { config } from '../src/config/env.js';
import { pool } from '../src/infrastructure/database/pool.js';
import { TutorProfileRepository } from '../src/infrastructure/repositories/tutorProfile.repository.js';
import { TransformersEmbedder } from '../src/infrastructure/embeddings/transformersEmbedder.js';
import { buildProfileText } from '../src/domain/profileText.js';

const THRESHOLD = 0.99;
const limit = Number(process.argv[2] ?? 20);
const cosine = (a, b) => a.reduce((sum, x, i) => sum + x * b[i], 0) / (Math.hypot(...a) * Math.hypot(...b));

let worst = 1;
try {
  const embedder = new TransformersEmbedder(config.embeddings);
  const rows = await new TutorProfileRepository(pool).listWithEmbeddingText(limit);
  console.log(`Comparing ${rows.length} stored embeddings with the ones computed by ${config.embeddings.model}`);

  for (const row of rows) {
    const text = buildProfileText(row.specialties, row.categories);
    const stored = JSON.parse(row.embedding_text);
    const computed = await embedder.embedPassage(text);
    const similarity = cosine(stored, computed);
    worst = Math.min(worst, similarity);
    console.log(`${similarity >= THRESHOLD ? 'OK  ' : 'DIFF'} ${similarity.toFixed(5)}  '${text}'`);
  }
  console.log(rows.length ? `\nWorst similarity: ${worst.toFixed(5)} (threshold ${THRESHOLD})` : 'No stored embeddings to compare.');
} catch (err) {
  console.error(`Error: ${err.message}`);
  worst = 0;
} finally {
  await pool.end();
}
process.exit(worst >= THRESHOLD ? 0 : 1);
