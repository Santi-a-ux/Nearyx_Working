import { mapSessionRoleToFeedAuthorRole, type FeedAuthorRole } from "@/lib/feed-author-role";

export type FeedComment = {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string;
  author_avatar?: string;
  content: string;
  created_at: string;
};

export type FeedPost = {
  id: string;
  author_id: string;
  content: string;
  image_url?: string;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  author_role?: FeedAuthorRole;
};

const SEED_STUDENT_IDS = {
  camila: "11111111-1111-4111-8111-111111111111",
  andres: "22222222-2222-4222-8222-222222222222",
  laura: "33333333-3333-4333-8333-333333333333",
} as const;

const SEED_TUTOR_IDS = {
  daniel: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  mariana: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  julian: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
} as const;

let feedPosts: FeedPost[] = [];
let feedComments: FeedComment[] = [];

function initializeSamplePosts() {
  if (feedPosts.length > 0) return;

  feedPosts = [
    {
      id: "sample-1",
      author_id: SEED_STUDENT_IDS.camila,
      content:
        "Necesito reforzar Cálculo para mi examen de admisión. ¿Alguien disponible para sesiones en la tarde? Preferentemente con experiencia en límites y derivadas.",
      created_at: new Date(Date.now() - 3600000 * 2).toISOString(),
      author_name: "Camila Ríos",
      author_role: "Estudiante",
    },
    {
      id: "sample-2",
      author_id: SEED_TUTOR_IDS.daniel,
      content:
        "Ingeniero de software con 9 años de experiencia en Medellín. Ofrezco clases de Python, JavaScript y arquitectura de sistemas. Cupos disponibles para sesiones 1:1.",
      created_at: new Date(Date.now() - 3600000 * 5).toISOString(),
      author_name: "Daniel Rojas",
      author_role: "Experto",
    },
    {
      id: "sample-3",
      author_id: SEED_STUDENT_IDS.andres,
      content:
        "Formando grupo de estudio para practicar conversación en inglés. Nivel intermedio. Buscamos 2-3 personas más en Medellín. Reuniones virtuales 2x por semana.",
      created_at: new Date(Date.now() - 3600000 * 8).toISOString(),
      author_name: "Andrés Gómez",
      author_role: "Estudiante",
    },
    {
      id: "sample-4",
      author_id: SEED_TUTOR_IDS.mariana,
      content:
        "Tutora de inglés y comunicación escrita en Medellín. Sesiones personalizadas para mejorar fluidez, pronunciación y redacción académica.",
      created_at: new Date(Date.now() - 3600000 * 12).toISOString(),
      author_name: "Mariana Torres",
      author_role: "Experto",
    },
  ];
}

export function readPosts(): FeedPost[] {
  initializeSamplePosts();
  return feedPosts;
}

export function writePosts(posts: FeedPost[]) {
  feedPosts = posts;
}

export function readComments(postId?: string): FeedComment[] {
  initializeSamplePosts();
  if (!postId) return feedComments;
  return feedComments.filter((comment) => comment.post_id === postId);
}

export function addComment(comment: FeedComment) {
  feedComments = [comment, ...feedComments];
}

export function findPost(postId: string): FeedPost | undefined {
  return readPosts().find((post) => post.id === postId);
}

export { mapSessionRoleToFeedAuthorRole };
