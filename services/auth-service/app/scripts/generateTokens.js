import { config } from '../src/config/env.js';
import { TokenProvider } from '../src/infrastructure/security/tokenProvider.js';

const USERS = [
  ['c1b7f33a-2b9c-4c9e-8f70-111111111111', 'David Ramírez López'],
  ['c1b7f33a-2b9c-4c9e-8f70-222222222222', 'Isabella García Martínez'],
  ['c1b7f33a-2b9c-4c9e-8f70-333333333333', 'Carlos Enrique Vega'],
  ['c1b7f33a-2b9c-4c9e-8f70-444444444444', 'Martina Rodríguez Acevedo'],
  ['550e8400-e29b-41d4-a716-446655440005', 'Sebastián Morales Londoño'],
];

const tokenProvider = new TokenProvider(config.jwt);

for (const [uid, name] of USERS) {
  const token = tokenProvider.createAccessToken(uid, 'tutor');
  console.log(`${name} | ${uid} | ${token}`);
}
