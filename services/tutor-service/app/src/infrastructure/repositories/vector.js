/** pgvector text literal ("[0.1,0.2,...]"). Sent as text and cast to `vector` in SQL (works behind poolers). */
export const toVectorLiteral = (embedding) => (embedding ? `[${embedding.join(',')}]` : null);
