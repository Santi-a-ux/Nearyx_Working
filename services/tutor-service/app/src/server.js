import { config } from './config/env.js';
import { pool } from './infrastructure/database/pool.js';
import { initSchema } from './infrastructure/database/initSchema.js';
import { buildContainer } from './container.js';
import { createApp } from './app.js';
import { buildProfileText } from './domain/profileText.js';

await initSchema();

const container = buildContainer();
const server = createApp(container).listen(config.port, () => {
  console.log(`TTP Tutor Service listening on port ${config.port}`);
});

// Load the embedding model in the background (the first run downloads ~470 MB). The service answers requests
// meanwhile; only `?q=` searches wait for the model.
async function backfillMissingEmbeddings({ profileRepository, embedder }) {
  const profiles = await profileRepository.listWithoutEmbedding();
  console.log(`[tutor-service] profiles without embedding: ${profiles.length}`);
  let filled = 0;
  for (const profile of profiles) {
    const embedding = await embedder.embedPassage(buildProfileText(profile.specialties, profile.categories));
    if (!embedding) continue; // no specialties/categories: nothing to embed
    await profileRepository.setEmbedding(profile.userId, embedding);
    filled += 1;
  }
  console.log(`[tutor-service] embeddings backfilled: ${filled}`);
}

container.embedder
  .warmUp()
  .then(async () => {
    console.log('[tutor-service] embedding model ready');
    if (process.env.BACKFILL_EMBEDDINGS_ON_START === 'true') await backfillMissingEmbeddings(container);
  })
  .catch((err) => console.error(`[tutor-service] embedding model not loaded yet: ${err.message}`));

const shutdown = async () => {
  server.close();
  await pool.end();
  process.exit(0);
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
