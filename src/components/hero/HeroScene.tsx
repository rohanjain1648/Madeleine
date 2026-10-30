"use client";

import { Billboard, Float, Sparkles, SpotLight } from "@react-three/drei";
import { Canvas, useFrame, type ThreeEvent } from "@react-three/fiber";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

const CAPTIONS = [
  "Coney Island, '58",
  "Our first dance",
  "Saturday matinee",
  "Radio nights",
  "Sunday best",
  "Summer at the shore",
  "The wedding",
  "Mother's kitchen",
  "The drive-in",
  "The dance hall",
  "Our song",
  "Christmas, '61",
  "The new car",
  "Off to the pictures",
  "Blackpool, '66",
  "Marine Drive",
];

const SKIES = [
  ["#f6c66a", "#e0703f", "#2f6f73"],
  ["#9cc7d9", "#f2d29a", "#4f7d4a"],
  ["#f2a65a", "#c8453a", "#3b2a4a"],
  ["#bcd7c3", "#f6e2b3", "#7a5a3a"],
  ["#e9b6a0", "#a96a8a", "#2d3b5a"],
  ["#f3dc8a", "#88b0c8", "#355e6e"],
];

type Kind = "polaroid" | "slide" | "vinyl" | "postcard";
const KINDS: Kind[] = ["polaroid", "slide", "polaroid", "vinyl", "postcard", "slide"];

function rng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/** Paints a small Kodachrome-toned "photo": sky, sun, hills, a shoreline. */
function paintPhoto(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, seed: number) {
  const r = rng(seed + 7);
  const [top, mid, low] = SKIES[seed % SKIES.length];
  const sky = g.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, top);
  sky.addColorStop(0.62, mid);
  sky.addColorStop(1, low);
  g.fillStyle = sky;
  g.fillRect(x, y, w, h);
  g.fillStyle = "rgba(255,240,200,0.85)";
  g.beginPath();
  g.arc(x + w * (0.25 + r() * 0.5), y + h * (0.28 + r() * 0.2), w * (0.07 + r() * 0.05), 0, Math.PI * 2);
  g.fill();
  for (let layer = 0; layer < 3; layer++) {
    g.fillStyle = `rgba(${30 + layer * 18},${22 + layer * 12},${20 + layer * 10},${0.55 + layer * 0.15})`;
    g.beginPath();
    const base = y + h * (0.6 + layer * 0.12);
    g.moveTo(x, y + h);
    for (let i = 0; i <= 12; i++) {
      const px = x + (w * i) / 12;
      g.lineTo(px, base - Math.sin(i * (0.6 + r()) + seed) * h * 0.05 - r() * h * 0.03);
    }
    g.lineTo(x + w, y + h);
    g.closePath();
    g.fill();
  }
  // grain
  const grain = g.getImageData(x, y, w, h);
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (r() - 0.5) * 26;
    grain.data[i] += n;
    grain.data[i + 1] += n;
    grain.data[i + 2] += n;
  }
  g.putImageData(grain, x, y);
}

function makeTexture(kind: Kind, caption: string, seed: number, serif: string) {
  const size = { polaroid: [420, 500], slide: [440, 440], vinyl: [440, 440], postcard: [500, 350] }[kind];
  const [w, h] = size;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  if (kind === "polaroid") {
    g.fillStyle = "#f8f3e8";
    g.fillRect(0, 0, w, h);
    paintPhoto(g, 22, 22, w - 44, w - 44, seed);
    g.fillStyle = "#3a2a22";
    g.font = `italic 34px ${serif}`;
    g.textAlign = "center";
    g.fillText(caption, w / 2, h - 34);
  } else if (kind === "slide") {
    const grad = g.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, "#f6ecd6");
    grad.addColorStop(1, "#dcc9a6");
    g.fillStyle = grad;
    g.beginPath();
    g.roundRect(0, 0, w, h, 18);
    g.fill();
    g.save();
    g.beginPath();
    g.roundRect(54, 70, w - 108, h - 160, 26);
    g.clip();
    paintPhoto(g, 54, 70, w - 108, h - 160, seed);
    g.restore();
    g.fillStyle = "#6a5040";
    g.font = `600 22px ${serif}`;
    g.textAlign = "center";
    g.fillText(caption, w / 2, h - 40);
  } else if (kind === "vinyl") {
    const cx = w / 2;
    g.fillStyle = "#0d0d0d";
    g.beginPath();
    g.arc(cx, cx, cx - 4, 0, Math.PI * 2);
    g.fill();
    for (let rr = cx - 10; rr > cx * 0.38; rr -= 3) {
      g.strokeStyle = rr % 2 ? "#1c1c1c" : "#141414";
      g.beginPath();
      g.arc(cx, cx, rr, 0, Math.PI * 2);
      g.stroke();
    }
    g.fillStyle = SKIES[seed % SKIES.length][1];
    g.beginPath();
    g.arc(cx, cx, cx * 0.34, 0, Math.PI * 2);
    g.fill();
    g.fillStyle = "#1b1310";
    g.font = `italic 22px ${serif}`;
    g.textAlign = "center";
    g.fillText(caption, cx, cx - 18);
    g.beginPath();
    g.arc(cx, cx, 8, 0, Math.PI * 2);
    g.fill();
  } else {
    g.fillStyle = "#f1e6cf";
    g.fillRect(0, 0, w, h);
    paintPhoto(g, 18, 18, w - 36, h - 92, seed);
    g.fillStyle = "#3a2a22";
    g.font = `italic 30px ${serif}`;
    g.textAlign = "left";
    g.fillText(caption, 24, h - 30);
    g.strokeStyle = "#72a3cf";
    g.setLineDash([5, 4]);
    g.lineWidth = 3;
    g.strokeRect(w - 74, h - 66, 50, 44);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return { tex, aspect: w / h, round: kind === "vinyl" };
}

interface CardSpec {
  position: [number, number, number];
  rotation: [number, number, number];
  scale: number;
  tex: THREE.CanvasTexture;
  aspect: number;
  round: boolean;
}

function Card({ spec, index }: { spec: CardSpec; index: number }) {
  const ref = useRef<THREE.Group>(null);
  const [hover, setHover] = useState(false);
  useFrame((_, dt) => {
    const m = ref.current;
    if (!m) return;
    const target = hover ? spec.scale * 1.18 : spec.scale;
    m.scale.setScalar(THREE.MathUtils.damp(m.scale.x, target, 6, dt));
    if (spec.round) m.rotation.z += dt * 0.6;
  });
  const geometry = useMemo(
    () => (spec.round ? new THREE.CircleGeometry(0.5, 64) : new THREE.PlaneGeometry(spec.aspect, 1)),
    [spec.round, spec.aspect],
  );
  return (
    <Float speed={0.9 + (index % 4) * 0.15} rotationIntensity={0.2} floatIntensity={0.6}>
      {/* Cards orbit in depth but always turn their picture towards the viewer, with a slight tilt. */}
      <Billboard position={spec.position}>
        <group
          ref={ref}
          rotation={spec.rotation}
          scale={spec.scale}
          onPointerOver={(e: ThreeEvent<PointerEvent>) => {
            e.stopPropagation();
            setHover(true);
          }}
          onPointerOut={() => setHover(false)}
        >
          <mesh geometry={geometry}>
            <meshStandardMaterial map={spec.tex} roughness={0.75} metalness={0.02} transparent={spec.round} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </Billboard>
    </Float>
  );
}

function Constellation({ serif, still }: { serif: string; still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const cards = useMemo<CardSpec[]>(() => {
    const r = rng(42);
    return CAPTIONS.map((caption, i) => {
      const kind = KINDS[i % KINDS.length];
      const { tex, aspect, round } = makeTexture(kind, caption, i * 13 + 3, serif);
      const angle = (i / CAPTIONS.length) * Math.PI * 2 + r() * 0.3;
      const radius = 3.9 + r() * 1.5;
      const y = (r() - 0.5) * 4;
      return {
        position: [Math.cos(angle) * radius, y, Math.sin(angle) * radius - 1],
        rotation: [(r() - 0.5) * 0.3, (r() - 0.5) * 0.7, (r() - 0.5) * 0.28],
        scale: round ? 1.2 + r() * 0.3 : 1.0 + r() * 0.4,
        tex,
        aspect,
        round,
      };
    });
  }, [serif]);

  useEffect(() => () => cards.forEach((c) => c.tex.dispose()), [cards]);

  useFrame((state, dt) => {
    if (group.current) {
      if (!still) group.current.rotation.y += dt * 0.045;
      // On wide screens the constellation sits right of the headline; on phones it stays centred and recedes.
      const wide = state.viewport.width > 9;
      group.current.position.x = THREE.MathUtils.damp(group.current.position.x, wide ? state.viewport.width * 0.2 : 0, 3, dt);
      group.current.position.z = THREE.MathUtils.damp(group.current.position.z, wide ? 0 : -2.5, 3, dt);
    }
    const { pointer, camera } = state;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, pointer.x * 0.8, 2, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, 0.4 + pointer.y * 0.4, 2, dt);
    camera.lookAt(0, 0, 0);
  });

  return (
    <group ref={group}>
      {cards.map((c, i) => (
        <Card key={i} spec={c} index={i} />
      ))}
    </group>
  );
}

export default function HeroScene() {
  const [serif, setSerif] = useState<string | null>(null);
  const [still, setStill] = useState(false);

  useEffect(() => {
    setStill(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    const family = getComputedStyle(document.documentElement).getPropertyValue("--font-fraunces").trim() || "Georgia, serif";
    void document.fonts.ready.then(() => setSerif(family));
  }, []);

  if (!serif) return null;
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.4, 8.2], fov: 42 }}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      fallback={null}
    >
      <ambientLight intensity={0.55} color="#ffe2b8" />
      <SpotLight
        position={[-5.5, 6.5, 3]}
        angle={0.55}
        penumbra={0.9}
        distance={22}
        attenuation={9}
        anglePower={4}
        intensity={60}
        opacity={0.22}
        color="#ffcf7a"
      />
      <pointLight position={[2, 1, 6]} intensity={12} color="#f2a53b" distance={14} />
      <Constellation serif={serif} still={still} />
      <Sparkles count={170} scale={[13, 7, 9]} size={2.4} speed={still ? 0 : 0.22} opacity={0.75} color="#ffd9a0" noise={1.2} />
    </Canvas>
  );
}
