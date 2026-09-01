"""
Genera embeddings semánticos localmente, sin depender de ninguna API externa.

Modelo: intfloat/multilingual-e5-small
- Corre en CPU, no necesita GPU.
- Entiende español razonablemente bien.
- Se descarga una sola vez (~470MB) y queda cacheado en el contenedor/volumen.

El modelo e5 requiere un prefijo distinto según el uso:
- "passage: " para el texto que se guarda (perfil del especialista).
- "query: "   para el texto que el usuario busca.
Esto mejora bastante la precisión del match semántico.
"""

from functools import lru_cache
from typing import List, Optional
from sentence_transformers import SentenceTransformer

_MODEL_NAME = "intfloat/multilingual-e5-small"

@lru_cache(maxsize=1)
def _get_model() -> SentenceTransformer:
    # Se carga una sola vez por proceso (lazy init) y se reutiliza en cada request.
    return SentenceTransformer(_MODEL_NAME)


def build_profile_text(specialties: Optional[List[str]], categories: Optional[List[str]]) -> str:
    """Concatena specialties + categories en un solo texto para generar el embedding del perfil."""
    parts = (specialties or []) + (categories or [])
    return ", ".join(p for p in parts if p).strip()


def embed_passage(text: str) -> Optional[List[float]]:
    """Genera el embedding de un perfil (texto que se guarda)."""
    if not text:
        return None
    model = _get_model()
    vector = model.encode(f"passage: {text}", normalize_embeddings=True)
    return vector.tolist()


def embed_query(text: str) -> Optional[List[float]]:
    """Genera el embedding de una búsqueda (texto que escribe el usuario)."""
    if not text or not text.strip():
        return None
    model = _get_model()
    vector = model.encode(f"query: {text.strip()}", normalize_embeddings=True)
    return vector.tolist()
