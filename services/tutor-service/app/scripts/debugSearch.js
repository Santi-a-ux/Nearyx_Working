/**
 * Diagnostic: prints the real semantic distance between a search text and every stored profile, to calibrate
 * the relevance thresholds (src/domain/searchPolicy.js) with real data.
 * Usage:  npm run debug:search -- "llanta"
 */
import { config } from '../src/config/env.js';
import { pool } from '../src/infrastructure/database/pool.js';
import { TutorProfileRepository } from '../src/infrastructure/repositories/tutorProfile.repository.js';
import { TransformersEmbedder } from '../src/infrastructure/embeddings/transformersEmbedder.js';

const query = process.argv.slice(2).join(' ').trim();
if (!query) {
  console.error('Usage: npm run debug:search -- "text to search"');
  process.exit(1);
}

try {
  const embedding = await new TransformersEmbedder(config.embeddings).embedQuery(query);
  const rows = await new TutorProfileRepository(pool).distancesTo(embedding);

  console.log(`\nSearch: '${query}'\n${'-'.repeat(50)}`);
  for (const row of rows) {
    const text = [...(row.specialties ?? []), ...(row.categories ?? [])].join(', ');
    console.log(`distance=${Number(row.distance).toFixed(4)}  |  ${text}  (id=${row.id})`);
  }
  console.log();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
