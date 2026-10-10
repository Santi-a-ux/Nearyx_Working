/**
 * One-off: generates the embedding of the tutor profiles that do not have one yet (embedding IS NULL).
 * With --all it recomputes EVERY profile (needed after changing EMBEDDING_DTYPE or the model).
 * Usage (from services/tutor-service/app, same DATABASE_URL as the service):  npm run backfill:embeddings [-- --all]
 */
import { config } from '../src/config/env.js';
import { pool } from '../src/infrastructure/database/pool.js';
import { TutorProfileRepository } from '../src/infrastructure/repositories/tutorProfile.repository.js';
import { TransformersEmbedder } from '../src/infrastructure/embeddings/transformersEmbedder.js';
import { buildProfileText } from '../src/domain/profileText.js';

const repository = new TutorProfileRepository(pool);
const embedder = new TransformersEmbedder(config.embeddings);

try {
  const all = process.argv.includes('--all');
  const profiles = all ? await repository.listAllProfiles() : await repository.listWithoutEmbedding();
  console.log(`Profiles to embed${all ? ' (all)' : ' (without embedding)'}: ${profiles.length}`);

  for (const profile of profiles) {
    const text = buildProfileText(profile.specialties, profile.categories);
    await repository.setEmbedding(profile.userId, await embedder.embedPassage(text));
    console.log(` - ${profile.id}: '${text}'`);
  }
  console.log('Done.');
} catch (err) {
  console.error(`Error: ${err.message}`);
  process.exitCode = 1;
} finally {
  await pool.end();
}
