/**
 * Calibrates SEMANTIC_MIN_SEPARATION with real data. For each test search it prints how far the best match
 * stands out from the median distance of the catalog, then checks whether real matches can be told apart from noise.
 * Edit CASES to fit your catalog ("match" = a tutor of that topic exists, "none" = nobody should be returned).
 * Usage:  npm run calibrate:search
 */
import { config } from '../src/config/env.js';
import { pool } from '../src/infrastructure/database/pool.js';
import { TutorProfileRepository } from '../src/infrastructure/repositories/tutorProfile.repository.js';
import { TransformersEmbedder } from '../src/infrastructure/embeddings/transformersEmbedder.js';
import { evaluateDistances, SEMANTIC_SEARCH } from '../src/domain/searchPolicy.js';

const CASES = [
  { q: 'arreglar carro', expect: 'match' },
  { q: 'jardineria', expect: 'match' },
  { q: 'cocinar', expect: 'match' },
  { q: 'diseño grafico', expect: 'match' },
  { q: 'matematicas', expect: 'none' },
  { q: 'yoga', expect: 'none' },
  { q: 'ingles', expect: 'none' },
  { q: 'programacion', expect: 'none' },
];

const f = (x) => (x === null ? '  -   ' : x.toFixed(4));

try {
  const embedder = new TransformersEmbedder(config.embeddings);
  const repo = new TutorProfileRepository(pool);
  const results = [];

  for (const { q, expect } of CASES) {
    const rows = await repo.distancesTo(await embedder.embedQuery(q));
    const distances = rows.map((r) => Number(r.distance));
    const v = evaluateDistances(distances);
    const mean = distances.reduce((a, b) => a + b, 0) / distances.length;
    const std = Math.sqrt(distances.reduce((a, b) => a + (b - mean) ** 2, 0) / distances.length);
    results.push({ q, expect, v, z: std ? (mean - v.best) / std : 0 });
  }

  console.log(`\nprofiles with embedding: ${results[0]?.v.n}   (current MIN_SEPARATION=${SEMANTIC_SEARCH.minSeparation})`);
  console.log('query'.padEnd(18), 'expect'.padEnd(7), 'best'.padEnd(8), 'median'.padEnd(8), 'separ.'.padEnd(8), 'z'.padEnd(6), 'returns');
  for (const { q, expect, v, z } of results) {
    const ok = expect === 'match' ? v.accepted.length > 0 : v.accepted.length === 0;
    console.log(
      q.padEnd(18), expect.padEnd(7), f(v.best).padEnd(8), f(v.median).padEnd(8), f(v.separation).padEnd(8),
      z.toFixed(2).padEnd(6), `${v.accepted.length} ${ok ? 'OK' : '<-- WRONG'}`,
    );
  }

  const sep = (kind) => results.filter((r) => r.expect === kind).map((r) => r.v.separation);
  const minMatch = Math.min(...sep('match'));
  const maxNone = Math.max(...sep('none'));
  console.log(`\nlowest separation of a real match: ${f(minMatch)}   highest separation of noise: ${f(maxNone)}`);
  if (minMatch > maxNone) {
    const suggested = ((minMatch + maxNone) / 2).toFixed(3);
    console.log(`Separable. Suggested: SEMANTIC_MIN_SEPARATION=${suggested}`);
  } else {
    console.log('NOT separable by median. Enrich the profile text (see README) before tuning thresholds.');
  }
  console.log();
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
