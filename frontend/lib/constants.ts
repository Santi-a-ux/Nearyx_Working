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
    author_id: "sample-student-1",
    author_name: "María José González",
    content: "Necesito reforzar Cálculo para mi examen de admisión. ¿Alguien disponible para sesiones en la tarde? Preferentemente con experiencia en límites y derivadas.",
    created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: "sample-2",
    author_id: "sample-tutor-1",
    author_name: "Roberto Martínez",
    content: "Ingeniero de software con 8 años de experiencia. Ofrezco clases de Python, JavaScript y arquitectura de sistemas. Cupos disponibles para sesiones 1:1 y grupos. Preparación también para entrevistas técnicas.",
    created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
  },
  {
    id: "sample-3",
    author_id: "sample-student-2",
    author_name: "Luis Andrés Rodríguez",
    content: "Formando grupo de estudio para practicar conversación en inglés. Nivel intermedio. Buscamos 2-3 personas más interesadas en mejorar fluidez y pronunciación. Reuniones virtuales 2x por semana.",
    created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
  },
  {
    id: "sample-4",
    author_id: "sample-tutor-2",
    author_name: "Dra. Sofía Ramírez",
    content: "Profesora de Física con especialización en enseñanza interactiva. Utilizo simulaciones y experimentos virtuales para que los conceptos sean claros y fascinantes. Disponibilidad flexible.",
    created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];
