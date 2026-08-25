"use client";

import { useEffect, useRef, useState, useCallback } from "react";

/* ============================================================
   TYPES — mirror the API response shape exactly
   ============================================================ */
interface PersonNode {
  user_id: string;
  display_name: string;
  bio: string | null;
  avatar_url: string | null;
  role: string;
  specialties: string[];
  categories: string[];
  common_topics: string[];
  score: number;
  connection_count: number;
  reason: string;
}

interface RecommendationsResponse {
  user_id: string;
  people: PersonNode[];
  tutors: PersonNode[];
}

interface GraphNode {
  id: string;
  label: string;
  role: "self" | "tutor" | "people";
  bio: string;
  reason: string;
  categories: string[];
  score: number;
  connectionCount: number;
  baseR: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  _r?: number;
}

interface GraphEdge {
  a: string;
  b: string;
  weight: number;
  secondary?: boolean;
}

interface Star {
  x: number;
  y: number;
  r: number;
  baseAlpha: number;
  twinkleSpeed: number;
  phase: number;
  drift: number;
  color: string;
}

interface ShootingStar {
  x: number;
  y: number;
  len: number;
  speed: number;
  angle: number;
  life: number;
}

/* ============================================================
   PROPS
   ============================================================ */
interface NetworkGraphBackgroundProps {
  /** The logged-in user's id, used to call the recommendations endpoint */
  userId: string;
  /** Full URL to the recommendations endpoint. Defaults to same-origin /api proxy. */
  endpoint?: string;
  /** Optional fallback data shown if the fetch fails (e.g. during local dev) */
  fallbackData?: RecommendationsResponse;
  /**
   * Shifts the graph's center down from the vertical middle of the viewport,
   * in pixels. Use this to keep the cluster (and the "self" node) clear of
   * content sitting near the top of the page. Defaults to 160.
   */
  verticalOffset?: number;
}

const COLORS = {
  self: "#ff5da2",
  tutor: "#ffd166",
  people: "#6ea8ff",
};

export default function NetworkGraphBackground({
  userId,
  endpoint,
  fallbackData,
  verticalOffset = 160,
}: NetworkGraphBackgroundProps) {
  const starsCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const graphCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const starsRef = useRef<Star[]>([]);
  const shootingStarsRef = useRef<ShootingStar[]>([]);
  const hoveredNodeRef = useRef<GraphNode | null>(null);
  const mouseRef = useRef({ x: -9999, y: -9999 });
  const sizeRef = useRef({ w: 0, h: 0, dpr: 1 });
  const offsetRef = useRef(verticalOffset);
  offsetRef.current = verticalOffset;
  const rafRef = useRef<number | null>(null);

  const [status, setStatus] = useState("Cargando red…");

  const url =
    endpoint ?? `/api/tutors/recommendations/${encodeURIComponent(userId)}`;

  /* ---------- helpers that read/write refs, defined once ---------- */

  const buildStars = useCallback(() => {
    const { w, h } = sizeRef.current;
    const density = (w * h) / 5500;
    const starColors = [
      "255,255,255", // white
      "255,255,255",
      "255,255,255",
      "200,220,255", // cool blue-white
      "255,224,200", // warm amber
      "230,210,255", // faint violet
    ];
    starsRef.current = Array.from({ length: Math.round(density) }, () => {
      const isBright = Math.random() < 0.12;
      return {
        x: Math.random() * w,
        y: Math.random() * h,
        r: isBright ? Math.random() * 1.6 + 1.2 : Math.random() * 1.1 + 0.3,
        baseAlpha: isBright ? Math.random() * 0.3 + 0.6 : Math.random() * 0.45 + 0.25,
        twinkleSpeed: Math.random() * 0.02 + 0.004,
        phase: Math.random() * Math.PI * 2,
        drift: (Math.random() - 0.5) * 0.02,
        color: starColors[Math.floor(Math.random() * starColors.length)],
      };
    });
  }, []);

  const buildGraph = useCallback((data: RecommendationsResponse) => {
    const { w, h } = sizeRef.current;
    const cy = h / 2 + offsetRef.current;
    const nodes: GraphNode[] = [];
    const edges: GraphEdge[] = [];

    const centerNode: GraphNode = {
      id: data.user_id,
      label: "Tú",
      role: "self",
      bio: "",
      reason: "",
      categories: [],
      score: 0,
      connectionCount: 0,
      baseR: 26,
      x: w / 2,
      y: cy,
      vx: 0,
      vy: 0,
    };
    nodes.push(centerNode);

    const all = [
      ...(data.people || []).map((p) => ({ ...p, role: p.role || "student" })),
      ...(data.tutors || []).map((t) => ({ ...t, role: "tutor" })),
    ];

    const maxScore = Math.max(1, ...all.map((p) => p.score || 1));

    all.forEach((p, i) => {
      const angle = (i / Math.max(1, all.length)) * Math.PI * 2 + Math.random() * 0.4;
      const radius = 160 + Math.random() * 140;
      const scoreRatio = (p.score || 1) / maxScore;
      nodes.push({
        id: p.user_id,
        label: p.display_name,
        role: p.role === "tutor" ? "tutor" : "people",
        bio: p.bio || "",
        reason: p.reason || "",
        categories: p.categories || [],
        score: p.score || 0,
        connectionCount: p.connection_count || 0,
        baseR: 10 + scoreRatio * 14,
        x: w / 2 + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
        vx: 0,
        vy: 0,
      });
      edges.push({ a: centerNode.id, b: p.user_id, weight: scoreRatio });
    });

    for (let i = 1; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const n1 = nodes[i];
        const n2 = nodes[j];
        const shared = n1.categories.some((c) => n2.categories.includes(c));
        if (shared) {
          edges.push({ a: n1.id, b: n2.id, weight: 0.15, secondary: true });
        }
      }
    }

    nodesRef.current = nodes;
    edgesRef.current = edges;
  }, []);

  const findNodeById = (id: string) =>
    nodesRef.current.find((n) => n.id === id);

  const findNodeAt = (x: number, y: number) => {
    const nodes = nodesRef.current;
    for (let i = nodes.length - 1; i >= 0; i--) {
      const n = nodes[i];
      const r = (n._r ?? n.baseR) + 6;
      const dx = x - n.x;
      const dy = y - n.y;
      if (dx * dx + dy * dy <= r * r) return n;
    }
    return null;
  };

  /* ---------- effect: size handling ---------- */
  useEffect(() => {
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = window.innerWidth;
      const h = window.innerHeight;
      sizeRef.current = { w, h, dpr };

      [starsCanvasRef.current, graphCanvasRef.current].forEach((c) => {
        if (!c) return;
        c.width = w * dpr;
        c.height = h * dpr;
        c.style.width = w + "px";
        c.style.height = h + "px";
        const ctx = c.getContext("2d");
        ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
      });

      buildStars();
    };

    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [buildStars]);

  /* ---------- effect: fetch data and build the graph ---------- */
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const res = await fetch(url, { headers: { Accept: "application/json" } });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: RecommendationsResponse = await res.json();
        if (cancelled) return;
        buildGraph(data);
        setStatus(`Red cargada — ${data.people.length + data.tutors.length} conexiones`);
      } catch (err) {
        if (cancelled) return;
        console.warn("No se pudo cargar la red de recomendaciones:", err);
        if (fallbackData) {
          buildGraph(fallbackData);
          setStatus("Vista previa con datos de ejemplo (API no disponible)");
        } else {
          setStatus("No se pudo cargar la red");
        }
      }
    }

    // graph needs a sized canvas first
    if (sizeRef.current.w === 0) {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      sizeRef.current = { w: window.innerWidth, h: window.innerHeight, dpr };
    }
    load();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]);

  /* ---------- effect: mouse tracking (window-level so it never blocks the page) ---------- */
  useEffect(() => {
    // Deliberately listening on `window`, not the canvas: the canvas has
    // pointer-events:none (see JSX below) so real page content — forms,
    // links, buttons — stays fully clickable. Window mousemove still fires
    // regardless of pointer-events, so hover-to-grow keeps working.
    const onMove = (e: MouseEvent) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };

      const hit = findNodeAt(e.clientX, e.clientY);
      hoveredNodeRef.current = hit;

      const tooltip = tooltipRef.current;
      if (!tooltip) return;
      if (hit) {
        tooltip.style.opacity = "1";
        tooltip.style.left = e.clientX + "px";
        tooltip.style.top = e.clientY + "px";
        const roleLabel =
          hit.role === "self" ? "Tú" : hit.role === "tutor" ? "Tutor" : "Estudiante";
        tooltip.innerHTML = `<span class="ngb-role">${roleLabel}</span><b>${hit.label}</b>${
          hit.bio ? hit.bio : ""
        }${hit.reason ? `<br/><span style="opacity:.75">${hit.reason}</span>` : ""}`;
      } else {
        tooltip.style.opacity = "0";
      }
    };

    const onLeaveWindow = () => {
      hoveredNodeRef.current = null;
      if (tooltipRef.current) tooltipRef.current.style.opacity = "0";
    };

    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeaveWindow);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseleave", onLeaveWindow);
    };
  }, []);

  /* ---------- effect: animation loop (physics + draw, runs once) ---------- */
  useEffect(() => {
    const stepPhysics = () => {
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const { w, h } = sizeRef.current;

      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const distSq = dx * dx + dy * dy;
          const dist = Math.sqrt(distSq) || 0.01;
          if (dist < 360) {
            const force = 2200 / distSq;
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;
            a.vx += fx;
            a.vy += fy;
            b.vx -= fx;
            b.vy -= fy;
          }
        }
      }

      edges.forEach((e) => {
        const a = findNodeById(e.a);
        const b = findNodeById(e.b);
        if (!a || !b) return;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
        const targetLen = e.secondary ? 260 : 190 - e.weight * 60;
        const k = e.secondary ? 0.0015 : 0.01 + e.weight * 0.01;
        const diff = (dist - targetLen) * k;
        const fx = (dx / dist) * diff;
        const fy = (dy / dist) * diff;
        a.vx += fx;
        a.vy += fy;
        b.vx -= fx;
        b.vy -= fy;
      });

      nodes.forEach((n) => {
        n.vx += (w / 2 - n.x) * 0.0006;
        n.vy += (h / 2 + offsetRef.current - n.y) * 0.0006;
      });

      nodes.forEach((n) => {
        n.vx *= 0.86;
        n.vy *= 0.86;
        n.x += n.vx;
        n.y += n.vy;
      });
    };

    const currentRadius = (n: GraphNode) => {
      const isHover = n === hoveredNodeRef.current;
      const target = n.baseR * (isHover ? 1.9 : 1);
      n._r = n._r === undefined ? n.baseR : n._r;
      n._r += (target - n._r) * 0.18;
      return n._r;
    };

    const colorFor = (n: GraphNode) => COLORS[n.role];

    const maybeSpawnShootingStar = () => {
      const { w, h } = sizeRef.current;
      if (Math.random() < 0.004 && shootingStarsRef.current.length < 2) {
        shootingStarsRef.current.push({
          x: Math.random() * w * 0.4,
          y: Math.random() * h * 0.5,
          len: 120 + Math.random() * 80,
          speed: 8 + Math.random() * 6,
          angle: Math.PI / 6 + Math.random() * 0.2,
          life: 1,
        });
      }
    };

    const drawUniverse = () => {
      const sctx = starsCanvasRef.current?.getContext("2d");
      if (!sctx) return;
      const { w, h } = sizeRef.current;
      const t = Date.now() * 0.00003;

      // 1) Solid dark sky base — this is what makes it read as "space"
      //    instead of a faint tint over the page's own light background.
      const sky = sctx.createLinearGradient(0, 0, 0, h);
      sky.addColorStop(0, "#050512");
      sky.addColorStop(0.55, "#0a0d24");
      sky.addColorStop(1, "#04030a");
      sctx.fillStyle = sky;
      sctx.fillRect(0, 0, w, h);

      // 2) Large, slow-drifting nebula clouds — soft colored gas
      const blobs = [
        { x: w * 0.18 + Math.sin(t) * 60, y: h * 0.22, r: w * 0.42, color: "rgba(120,80,220,0.16)" },
        { x: w * 0.82 + Math.cos(t * 1.3) * 70, y: h * 0.35, r: w * 0.36, color: "rgba(255,80,160,0.12)" },
        { x: w * 0.5 + Math.sin(t * 0.6) * 50, y: h * 0.75, r: w * 0.4, color: "rgba(60,120,255,0.13)" },
        { x: w * 0.3, y: h * 0.85 + Math.cos(t * 0.8) * 30, r: w * 0.28, color: "rgba(0,220,200,0.06)" },
      ];
      blobs.forEach((b) => {
        const g = sctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.r);
        g.addColorStop(0, b.color);
        g.addColorStop(1, "rgba(0,0,0,0)");
        sctx.fillStyle = g;
        sctx.fillRect(0, 0, w, h);
      });

      // 3) A faint diagonal "galaxy band" of dust, like a distant Milky Way
      sctx.save();
      sctx.translate(w / 2, h / 2);
      sctx.rotate(-0.35);
      const band = sctx.createLinearGradient(-w, 0, w, 0);
      band.addColorStop(0, "rgba(180,190,255,0)");
      band.addColorStop(0.5, "rgba(190,200,255,0.05)");
      band.addColorStop(1, "rgba(180,190,255,0)");
      sctx.fillStyle = band;
      sctx.fillRect(-w, -h * 0.16, w * 2, h * 0.32);
      sctx.restore();

      // 4) Stars, colored and twinkling, drawn on top of the nebula
      starsRef.current.forEach((s) => {
        s.phase += s.twinkleSpeed;
        s.x += s.drift;
        if (s.x < 0) s.x = w;
        if (s.x > w) s.x = 0;
        const alpha = Math.max(0, s.baseAlpha + Math.sin(s.phase) * 0.25);
        sctx.beginPath();
        sctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        sctx.fillStyle = `rgba(${s.color},${alpha})`;
        sctx.fill();
      });

      // 5) Occasional shooting stars
      maybeSpawnShootingStar();
      shootingStarsRef.current.forEach((sh) => {
        const dx = Math.cos(sh.angle) * sh.speed;
        const dy = Math.sin(sh.angle) * sh.speed;
        const tailX = sh.x - Math.cos(sh.angle) * sh.len;
        const tailY = sh.y - Math.sin(sh.angle) * sh.len;
        const grad = sctx.createLinearGradient(sh.x, sh.y, tailX, tailY);
        grad.addColorStop(0, `rgba(255,255,255,${sh.life})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");
        sctx.strokeStyle = grad;
        sctx.lineWidth = 1.6;
        sctx.beginPath();
        sctx.moveTo(sh.x, sh.y);
        sctx.lineTo(tailX, tailY);
        sctx.stroke();
        sh.x += dx;
        sh.y += dy;
        sh.life -= 0.012;
      });
      shootingStarsRef.current = shootingStarsRef.current.filter(
        (sh) => sh.life > 0 && sh.x < w + 50 && sh.y < h + 50
      );
    };

    const drawGraph = () => {
      const ctx = graphCanvasRef.current?.getContext("2d");
      if (!ctx) return;
      const { w, h } = sizeRef.current;
      ctx.clearRect(0, 0, w, h);

      edgesRef.current.forEach((e) => {
        const a = findNodeById(e.a);
        const b = findNodeById(e.b);
        if (!a || !b) return;
        const isHoverEdge =
          hoveredNodeRef.current && (a === hoveredNodeRef.current || b === hoveredNodeRef.current);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = isHoverEdge
          ? "rgba(110,168,255,0.8)"
          : e.secondary
          ? "rgba(154,166,212,0.16)"
          : "rgba(154,166,212,0.32)";
        ctx.lineWidth = isHoverEdge ? 2 : e.secondary ? 1 : 1.2;
        ctx.stroke();
      });

      nodesRef.current.forEach((n) => {
        const r = currentRadius(n);
        const isHover = n === hoveredNodeRef.current;
        const glowColor = colorFor(n);

        ctx.save();
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = isHover ? 26 : 10;

        if (isHover) {
          ctx.beginPath();
          ctx.arc(n.x, n.y, r + 12, 0, Math.PI * 2);
          ctx.fillStyle = "rgba(110,168,255,0.14)";
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = glowColor;
        ctx.globalAlpha = n.role === "self" ? 1 : 0.95;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.lineWidth = isHover ? 2.5 : 1.5;
        ctx.strokeStyle = "rgba(255,255,255,0.9)";
        ctx.stroke();
        ctx.restore();

        if (isHover || n.role === "self") {
          ctx.font = isHover ? "600 13px Segoe UI, sans-serif" : "600 12px Segoe UI, sans-serif";
          ctx.fillStyle = "#eef2ff";
          ctx.textAlign = "center";
          ctx.fillText(n.label, n.x, n.y + r + 16);
        }
      });
    };

    const loop = () => {
      stepPhysics();
      drawUniverse();
      drawGraph();
      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <canvas
        ref={starsCanvasRef}
        style={{ position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }}
      />
      <canvas
        ref={graphCanvasRef}
        style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none" }}
      />
      <div
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 3,
          fontSize: 12,
          color: "#9aa6d4",
          background: "rgba(14,19,48,.72)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 999,
          padding: "6px 12px",
          pointerEvents: "none",
        }}
      >
        {status}
      </div>
      <div
        style={{
          position: "fixed",
          left: 16,
          bottom: 16,
          zIndex: 3,
          background: "rgba(14,19,48,.72)",
          border: "1px solid rgba(255,255,255,.08)",
          borderRadius: 12,
          padding: "10px 14px",
          fontSize: 12,
          color: "#9aa6d4",
          display: "flex",
          gap: 14,
          pointerEvents: "none",
        }}
      >
        <LegendItem color={COLORS.self} label="Tú" />
        <LegendItem color={COLORS.people} label="Personas" />
        <LegendItem color={COLORS.tutor} label="Tutores" />
      </div>
      <div
        ref={tooltipRef}
        className="ngb-tooltip"
        style={{
          position: "fixed",
          pointerEvents: "none",
          zIndex: 5,
          background: "#12173a",
          color: "#fff",
          padding: "8px 12px",
          borderRadius: 10,
          fontSize: 12,
          lineHeight: 1.45,
          maxWidth: 220,
          opacity: 0,
          transform: "translate(-50%, -120%)",
          transition: "opacity .12s ease",
          boxShadow: "0 8px 24px rgba(0,0,0,.45)",
          border: "1px solid rgba(255,255,255,.08)",
        }}
      />
      <style jsx global>{`
        .ngb-tooltip b {
          display: block;
          font-size: 13px;
          margin-bottom: 2px;
          color: #fff;
        }
        .ngb-role {
          color: #a9b8e8;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }
      `}</style>
    </>
  );
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
      <i
        style={{
          width: 9,
          height: 9,
          borderRadius: "50%",
          display: "inline-block",
          background: color,
        }}
      />
      {label}
    </span>
  );
}