"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  rx: number;
  ry: number;
};

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  nodes: Node[],
  t: number,
  lineRgb: string,
  nodeRgb: string,
) {
  ctx.clearRect(0, 0, w, h);
  const maxDist = Math.min(260, w * 0.22);

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = a.x - b.x;
      const dy = a.y - b.y;
      const dist = Math.hypot(dx, dy);
      if (dist < maxDist && dist > 0) {
        const fade = 1 - dist / maxDist;
        ctx.strokeStyle = `rgba(${lineRgb}, ${fade * 0.4})`;
        ctx.lineWidth = 1.15;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
      }
    }
  }

  for (const n of nodes) {
    const glowR = 7;
    const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, glowR);
    g.addColorStop(0, `rgba(${nodeRgb}, 0.72)`);
    g.addColorStop(0.45, `rgba(${nodeRgb}, 0.28)`);
    g.addColorStop(1, `rgba(${nodeRgb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(n.x, n.y, glowR, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = `rgba(${nodeRgb}, 0.88)`;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 3.1, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * Subtle knowledge-graph canvas: spring-like motion to rest positions,
 * edges between nearby nodes. Respects prefers-reduced-motion.
 */
export function NeuralMeshBackground({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const surface = canvas;
    const context = ctx;

    let nodes: Node[] = [];
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;
    let t = 0;
    let reduced = false;

    function palette() {
      const dark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      return dark
        ? { line: "100, 116, 139", node: "96, 165, 250" }
        : { line: "161, 161, 170", node: "0, 112, 243" };
    }

    function initNodes() {
      const area = w * h;
      const count = Math.min(
        80,
        Math.max(32, Math.floor(area / 19000)),
      );
      nodes = [];
      const margin = 40;
      const mw = Math.max(0, w - margin * 2);
      const mh = Math.max(0, h - margin * 2);
      for (let i = 0; i < count; i++) {
        const rx = margin + Math.random() * mw;
        const ry = margin + Math.random() * mh;
        nodes.push({
          x: rx,
          y: ry,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          rx,
          ry,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      surface.width = w * dpr;
      surface.height = h * dpr;
      surface.style.width = `${w}px`;
      surface.style.height = `${h}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      initNodes();
      t = 0;
      const { line, node } = palette();
      if (reduced) {
        for (const n of nodes) {
          n.x = n.rx;
          n.y = n.ry;
        }
        drawFrame(context, w, h, nodes, t, line, node);
      }
    }

    function step() {
      t += 0.018;
      const k = 0.045;
      const damp = 0.935;
      const noise = 0.22;

      for (const n of nodes) {
        const ax =
          -k * (n.x - n.rx) +
          Math.sin(t * 0.55 + n.rx * 0.004 + n.ry * 0.003) * noise;
        const ay =
          -k * (n.y - n.ry) + Math.cos(t * 0.48 + n.ry * 0.004) * noise;
        n.vx = (n.vx + ax) * damp;
        n.vy = (n.vy + ay) * damp;
        n.x += n.vx;
        n.y += n.vy;
      }

      const { line, node } = palette();
      drawFrame(context, w, h, nodes, t, line, node);
      raf = requestAnimationFrame(step);
    }

    reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");

    function onScheme() {
      if (reduced && nodes.length) {
        const { line, node } = palette();
        drawFrame(context, w, h, nodes, t, line, node);
      }
    }

    resize();
    window.addEventListener("resize", resize);
    mq.addEventListener("change", onScheme);

    if (reduced) {
      const { line, node } = palette();
      drawFrame(context, w, h, nodes, t, line, node);
    } else {
      raf = requestAnimationFrame(step);
    }

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      mq.removeEventListener("change", onScheme);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "pointer-events-none fixed inset-0 z-0 h-full min-h-dvh w-full",
        className,
      )}
      aria-hidden
    />
  );
}
