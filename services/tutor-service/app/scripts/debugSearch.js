/**
 * Diagnostic: prints the real semantic distance between a search text and every stored profile, to calibrate
 * the relevance thresholds (src/domain/searchPolicy.js) with real data.
 * Usage:  npm run debug:search -- "llanta"
 */
import { config } from '../src/config/env.js';
import { pool } from '../src/infrastructure/database/pool.js';
import { TutorProfileRepository } from '../src/infrastructure/repositories/tutorProfile.repository.js';
import { TransformersEmbedder } from '../src/infrastructure/embeddings/transformersEmbedder.js';
import { evaluateDistances } from '../src/domain/searchPolicy.js';

const query = process.argv.slice(2).join(' ').trim();
if (!query) {
  console.error('Usage: npm run debug:search -- "text to search"');
  process.exit(1);
}

try {
  const embedding = await new TransformersEmbedder(config.embeddings).embedQuery(query);
  const rows = await new TutorProfileRepository(pool).distancesTo(embedding);

  const verdict = evaluateDistances(rows.map((r) => r.distance));
  const accepted = new Set(verdict.accepted);

  console.log(`\nSearch: '${query}'\n${'-'.repeat(50)}`);
  for (const row of rows) {
    const text = [...(row.specialties ?? []), ...(row.categories ?? [])].join(', ');
    const mark = accepted.has(Number(row.distance)) ? '✔' : ' ';
    console.log(`${mark} distance=${Number(row.distance).toFixed(4)}  |  ${text}  (id=${row.id})`);
  }
  console.log(
    `\nbest=${verdict.best?.toFixed(4)} median=${verdict.median?.toFixed(4)} separation=${verdict.separation?.toFixed(4)} ` +
      `-> ${verdict.hasMatch ? `${verdict.accepted.length} result(s) (✔)` : 'NO real match (nothing is returned)'}\n`,
  );
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
