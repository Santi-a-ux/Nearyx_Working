UPDATE "users".profiles
SET location_name = CASE user_id
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-111111111111' THEN 'El Poblado, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-222222222222' THEN 'Laureles, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-333333333333' THEN 'Belén Los Alpes, Medellín'
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-444444444444' THEN 'Envigado, Área Metropolitana'
  WHEN '550e8400-e29b-41d4-a716-446655440005' THEN 'Robledo, Medellín'
  ELSE location_name
END,
updated_at = NOW()
WHERE user_id IN (
  'c1b7f33a-2b9c-4c9e-8f70-111111111111',
  'c1b7f33a-2b9c-4c9e-8f70-222222222222',
  'c1b7f33a-2b9c-4c9e-8f70-333333333333',
  'c1b7f33a-2b9c-4c9e-8f70-444444444444',
  '550e8400-e29b-41d4-a716-446655440005'
);

UPDATE "tutors".profiles
SET coordinates = CASE user_id
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-111111111111' THEN ST_SetSRID(ST_MakePoint(-75.5715, 6.2060), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-222222222222' THEN ST_SetSRID(ST_MakePoint(-75.5965, 6.2430), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-333333333333' THEN ST_SetSRID(ST_MakePoint(-75.5998, 6.2145), 4326)
  WHEN 'c1b7f33a-2b9c-4c9e-8f70-444444444444' THEN ST_SetSRID(ST_MakePoint(-75.5842, 6.1838), 4326)
  WHEN '550e8400-e29b-41d4-a716-446655440005' THEN ST_SetSRID(ST_MakePoint(-75.5568, 6.2672), 4326)
  ELSE coordinates
END,
updated_at = NOW()
WHERE user_id IN (
  'c1b7f33a-2b9c-4c9e-8f70-111111111111',
  'c1b7f33a-2b9c-4c9e-8f70-222222222222',
  'c1b7f33a-2b9c-4c9e-8f70-333333333333',
  'c1b7f33a-2b9c-4c9e-8f70-444444444444',
  '550e8400-e29b-41d4-a716-446655440005'
);
