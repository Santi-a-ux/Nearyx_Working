/**
 * Application-wide constants and shared data
 */

export const FEATURED_TOPICS = [
  'Programación',
  'Python',
  'Django',
  'FastAPI',
  'Cocina y Repostería',
  'Música',
  'Yoga y Bienestar',
  'Fotografía',
  'Mecánica automotriz',
  'Conducción',
];

export const SAMPLE_POSTS = [
  {
    id: "sample-1",
    author_id: "11111111-1111-4111-8111-111111111111",
    author_name: "Camila Ríos",
    content: "Necesito reforzar Cálculo para mi examen de admisión. ¿Alguien disponible para sesiones en la tarde? Preferentemente con experiencia en límites y derivadas.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "sample-2",
    author_id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    author_name: "Daniel Rojas",
    content: "Ingeniero de software con 9 años de experiencia en Medellín. Ofrezco clases de Python, JavaScript y arquitectura de sistemas. Cupos disponibles para sesiones 1:1.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sample-3",
    author_id: "22222222-2222-4222-8222-222222222222",
    author_name: "Andrés Gómez",
    content: "Formando grupo de estudio para practicar conversación en inglés. Nivel intermedio. Buscamos 2-3 personas más en Medellín. Reuniones virtuales 2x por semana.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "sample-4",
    author_id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
    author_name: "Mariana Torres",
    content: "Tutora de inglés y comunicación escrita en Medellín. Sesiones personalizadas para mejorar fluidez, pronunciación y redacción académica.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
