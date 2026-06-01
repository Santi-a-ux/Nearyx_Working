# Guía visual Nearyx (shadcn)

Nearyx reutiliza **shadcn/ui** (`frontend/components/ui/*`). La identidad se aplica con **tokens CSS**, tipografía y variantes — no hay un UI kit paralelo.

## Tipografía

| Rol | Familia | Uso |
|-----|---------|-----|
| Display | **Fraunces** (`font-display`) | Hero, títulos editoriales, citas auth |
| UI / body | **Geist** (`font-sans`, default) | Navegación, formularios, feed |
| Meta | **Geist Mono** (`font-mono`, `.text-caption`) | Timestamps, distancia |

Cargadas con `next/font/google` en `app/layout.tsx`.

### Escala (utilidades en `app/globals.css`)

- `.text-display-xl` — una vez por vista (hero)
- `.text-display-lg` — H1 login / secciones
- `.text-display-md` — bloques editoriales
- `.text-h2`, `.text-h3` — módulos UI
- `.text-body`, `.text-body-lg` — párrafos
- `.text-label` — eyebrows / labels uppercase
- `.text-caption` — metadatos mono

**Regla:** serif solo en display; no usar Fraunces en botones ni labels de formulario.

## Tokens (`:root` en `globals.css`)

| Token | Valor | Uso |
|-------|-------|-----|
| `--primary` | `#2563eb` | Acciones, links |
| `--background` | `#f8fafc` | Fondo app |
| `--border` | `#e2e8f0` | Bordes shadcn |
| `--expert` | `#d97706` | Badge experto |
| `--student` | `#059669` | Badge estudiante |
| `--brand-soft` | `#dbeafe` | Acentos suaves |
| `--radius` | `12px` | Base shadcn |

## Componentes shadcn extendidos

### Button (`button.tsx`)

- `variant="brand"` — CTA principal (sombra + hover -1px)
- `variant="subtle"` — secundario sobre `--secondary`

### Badge (`badge.tsx`)

- `variant="expert"` · `variant="student"`

### Superficies (`lib/surface-styles.ts`)

- `cardElevatedClass` — cards con hover (landing, features)

## Composiciones de app

- `components/layout/site-nav.tsx` — nav landing
- `components/layout/section-header.tsx` — eyebrow + título + descripción

## Mapa preview (no interactivo)

- `components/map/map-preview.tsx` — Mapbox con `interactive: false`, pins de expertos, click en dashboard → `/explore`
- `components/map/map-grid-fallback.tsx` — si no hay token
- Landing usa demo pins en Medellín sin sesión; dashboard usa tutores reales con coordenadas

## Pantallas piloto (esta iteración)

1. **Landing** `/` — hero 2 columnas + `MapPreview`
2. **Auth** — split editorial oscuro + formulario en card
3. **Dashboard** — feed + popup publicar (sin cambiar lógica) + panel derecho mapa + lista expertos
4. **`/explore`** — mapa interactivo real (`MapboxMap`), sin cambios de comportamiento

## Mapbox (obligatorio para `/explore`)

Ver `README.md`: `MAPBOX_PUBLIC_TOKEN` + `NEXT_PUBLIC_MAPBOX_TOKEN` en `.env`.

## Próximos pasos (si vale la pena)

- Aplicar tokens al sidebar/topbar (quitar hex sueltos)
- `LiveMapModule` / `ExpertListItem` como composiciones
- Revisar contraste dark sidebar vs nueva paleta clara
