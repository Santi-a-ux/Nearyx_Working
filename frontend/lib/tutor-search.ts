export interface TutorSearchRecord {
  user_id: string;
  display_name?: string;
  full_name?: string;
  bio?: string;
  specialties?: string[];
  categories?: string[];
}

const STOPWORDS = new Set([
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "y",
  "e",
  "o",
  "u",
  "a",
  "en",
  "con",
  "para",
  "por",
  "sin",
  "que",
  "como",
  "sobre",
  "al",
  "un",
  "una",
  "unos",
  "unas",
  "tu",
  "tus",
  "mi",
  "mis",
  "su",
  "sus",
  "soy",
  "es",
  "son",
  "ser",
  "experto",
  "experta",
  "expertos",
  "expertas",
  "clase",
  "clases",
  "enfoque",
  "practico",
  "practica",
  "experiencia",
  "profesional",
  "disponible",
]);

type TopicDefinition = {
  token: string;
  label: string;
  keywords: string[];
};

const TOPIC_DEFINITIONS: TopicDefinition[] = [
  {
    token: "programacion",
    label: "Programación",
    keywords: ["programacion", "python", "django", "fastapi", "backend", "frontend", "codigo", "code", "software", "base", "dato", "database", "sql"],
  },
  {
    token: "cocina",
    label: "Cocina y Repostería",
    keywords: ["cocina", "gastronomia", "reposteria", "culinaria", "nutricion"],
  },
  {
    token: "musica",
    label: "Música",
    keywords: ["musica", "guitarra", "teoria", "composicion", "canto", "instrumento"],
  },
  {
    token: "bienestar",
    label: "Yoga y Bienestar",
    keywords: ["yoga", "meditacion", "bienestar", "salud", "pilates", "mindfulness"],
  },
  {
    token: "fotografia",
    label: "Fotografía",
    keywords: ["fotografia", "foto", "imagen", "edicion", "iluminacion", "camara"],
  },
  {
    token: "mecanica",
    label: "Mecánica automotriz",
    keywords: ["carro", "carros", "auto", "autos", "vehiculo", "vehiculos", "motor", "taller", "mecanica", "mecanico", "automovil", "automoviles", "reparacion", "reparar"],
  },
  {
    token: "conduccion",
    label: "Conducción",
    keywords: ["conducir", "conduccion", "manejar", "manejo", "licencia", "transito"],
  },
  {
    token: "idiomas",
    label: "Idiomas",
    keywords: ["ingles", "idioma", "idiomas", "frances", "aleman", "italiano", "pronunciacion", "fluidez"],
  },
];

const TOPIC_KEYWORD_TO_TOKEN = TOPIC_DEFINITIONS.reduce<Record<string, string>>((acc, definition) => {
  for (const keyword of definition.keywords) {
    acc[normalizeText(keyword)] = definition.token;
  }
  return acc;
}, {});

const SEARCH_SYNONYMS: Record<string, string[]> = {
  carro: [
    "auto",
    "autos",
    "vehiculo",
    "vehiculos",
    "vehículo",
    "vehículos",
    "automovil",
    "automoviles",
    "automóvil",
    "automóviles",
    "mecanica",
    "mecanico",
    "mecánica",
    "mecánico",
    "taller",
    "motor",
    "conducir",
    "manejar",
    "licencia",
    "reparacion",
    "reparación",
    "arreglar",
    "arreglo",
    "carro",
    "carros",
  ],
  mecanica: [
    "carro",
    "carros",
    "auto",
    "autos",
    "vehiculo",
    "vehiculos",
    "vehículo",
    "vehículos",
    "taller",
    "motor",
    "conducir",
    "manejar",
    "reparacion",
    "reparación",
    "arreglar",
    "arreglo",
  ],
  conducir: ["manejar", "manejo", "licencia", "auto", "carro", "vehiculo", "vehículo"],
  manejar: ["conducir", "manejo", "licencia", "auto", "carro", "vehiculo", "vehículo"],
};

const ACCENT_MAP: Record<string, string> = {
  á: "a",
  é: "e",
  í: "i",
  ó: "o",
  ú: "u",
  ü: "u",
  ñ: "n",
};

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .replace(/[áéíóúüñ]/g, (char) => ACCENT_MAP[char] ?? char)
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchText(value: string) {
  return normalizeText(value);
}

function singularize(token: string) {
  if (token.length <= 3) {
    return token;
  }

  if (token.endsWith("es") && token.length > 4) {
    return token.slice(0, -2);
  }

  if (token.endsWith("s") && token.length > 3) {
    return token.slice(0, -1);
  }

  return token;
}

function isUsefulToken(token: string) {
  if (!token) return false;
  if (token.length < 3) return false;
  if (/^\d+$/.test(token)) return false;
  return !STOPWORDS.has(token);
}

function canonicalizeTopicToken(token: string) {
  return TOPIC_KEYWORD_TO_TOKEN[token] ?? token;
}

function toDisplayLabel(token: string) {
  const fromDefinition = TOPIC_DEFINITIONS.find((definition) => definition.token === token)?.label;
  if (fromDefinition) return fromDefinition;

  return token
    .split(" ")
    .map((part) => (part ? part.charAt(0).toUpperCase() + part.slice(1) : part))
    .join(" ");
}

function expandTokens(text: string) {
  const tokens = normalizeText(text)
    .split(" ")
    .map(singularize)
    .filter(Boolean);

  const expanded = new Set<string>(tokens);

  for (const token of tokens) {
    const synonyms = SEARCH_SYNONYMS[token];
    if (!synonyms) continue;

    for (const synonym of synonyms) {
      expanded.add(normalizeText(synonym));
    }
  }

  return [...expanded];
}

export function getTutorSearchText(tutor: TutorSearchRecord) {
  return normalizeText(
    [
      tutor.display_name,
      tutor.full_name,
      tutor.bio,
      ...(tutor.specialties ?? []),
      ...(tutor.categories ?? []),
    ]
      .filter(Boolean)
      .join(" ")
  );
}

export function matchesTutorSearch(tutor: TutorSearchRecord, rawQuery: string) {
  const query = normalizeText(rawQuery);
  if (!query) {
    return true;
  }

  const haystack = getTutorSearchText(tutor);
  const expandedQueryTokens = expandTokens(query);
  const haystackTokens = new Set(haystack.split(" ").map(singularize));

  if (haystack.includes(query)) {
    return true;
  }

  return expandedQueryTokens.some((token) => {
    if (!token) {
      return false;
    }

    if (haystack.includes(token)) {
      return true;
    }

    const tokenized = singularize(token);
    if (haystackTokens.has(tokenized)) {
      return true;
    }

    const synonymGroup = SEARCH_SYNONYMS[tokenized];
    return synonymGroup ? synonymGroup.some((synonym) => haystack.includes(normalizeText(synonym))) : false;
  });
}

export function buildTutorOccupationLabel(tutor: TutorSearchRecord) {
  const rawText = [tutor.bio, tutor.display_name, tutor.full_name].filter(Boolean).join(" ").trim();
  if (!rawText) {
    return tutor.specialties?.[0] || tutor.categories?.[0] || "Especialista disponible";
  }

  if (rawText.length <= 72) {
    return rawText;
  }

  return `${rawText.slice(0, 69).trim()}...`;
}

export function matchesKeywordSearch(text: string, rawQuery: string) {
  const query = normalizeText(rawQuery);
  if (!query) {
    return true;
  }

  const haystack = normalizeText(text);
  const expandedQueryTokens = expandTokens(query);
  const haystackTokens = new Set(haystack.split(" ").map(singularize));

  if (haystack.includes(query)) {
    return true;
  }

  return expandedQueryTokens.some((token) => {
    if (!token) {
      return false;
    }

    if (haystack.includes(token)) {
      return true;
    }

    const tokenized = singularize(token);
    if (haystackTokens.has(tokenized)) {
      return true;
    }

    const synonymGroup = SEARCH_SYNONYMS[tokenized];
    return synonymGroup ? synonymGroup.some((synonym) => haystack.includes(normalizeText(synonym))) : false;
  });
}

export type DiscoveredTopic = {
  token: string;
  label: string;
  count: number;
};

export function discoverTopicsFromTutors(tutors: TutorSearchRecord[], max = 12): DiscoveredTopic[] {
  const freq: Record<string, number> = {};

  for (const t of tutors) {
    const text = getTutorSearchText(t);
    const tokens = expandTokens(text).filter(isUsefulToken).map(canonicalizeTopicToken);

    for (const token of tokens) {
      freq[token] = (freq[token] || 0) + 1;
    }

    // prefer declared specialties/categories as higher-weight tokens
    for (const s of t.specialties ?? []) {
      const toks = expandTokens(s).filter(isUsefulToken).map(canonicalizeTopicToken);
      for (const tok of toks) {
        freq[tok] = (freq[tok] || 0) + 4;
      }
    }

    for (const c of t.categories ?? []) {
      const toks = expandTokens(c).filter(isUsefulToken).map(canonicalizeTopicToken);
      for (const tok of toks) {
        freq[tok] = (freq[tok] || 0) + 3;
      }
    }
  }

  const items: DiscoveredTopic[] = Object.keys(freq)
    .map((k) => ({ token: k, label: toDisplayLabel(k), count: freq[k] }))
    .sort((a, b) => b.count - a.count)
    .slice(0, max);

  return items;
}