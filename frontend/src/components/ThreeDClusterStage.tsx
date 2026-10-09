import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Database,
  Zap,
  Layers,
  Key,
  ShieldCheck,
  Cpu,
  RotateCcw,
  Play,
  Pause,
  Box,
  Sliders,
  Sparkles,
  ArrowRight,
  HardDrive,
  Activity,
  Terminal,
} from 'lucide-react';
import { HOMEPAGE_STRINGS, COMMON_STRINGS } from '../constants/strings';

export interface ClusterBlockItem {
  id: string;
  name: string;
  category: string;
  desc: string;
  port: number;
  uiPort?: number;
  security: string;
  storage: string;
  accentColor: string;
  glowColor: string;
  borderColor: string;
  bgFace: string;
  icon: React.ReactNode;
  coords: { x: number; y: number; z: number };
  explodedCoords: { x: number; y: number; z: number };
}

interface ThreeDClusterStageProps {
  onSelectBlock?: (blockId: string) => void;
  selectedBlockId?: string | null;
  runningServiceIds?: string[];
}

export const ThreeDClusterStage: React.FC<ThreeDClusterStageProps> = ({
  onSelectBlock,
  selectedBlockId = 'postgres',
  runningServiceIds = [],
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Camera 3D angles
  const [rotX, setRotX] = useState<number>(22);
  const [rotY, setRotY] = useState<number>(-26);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 22,
    startRotY: -26,
  });

  const [isAutoRotate, setIsAutoRotate] = useState<boolean>(true);
  const [isExploded, setIsExploded] = useState<boolean>(false);
  const [hoveredBlockId, setHoveredBlockId] = useState<string | null>(null);

  // Define 6 3D infrastructure blocks
  const blocks: ClusterBlockItem[] = useMemo(
    () => [
      {
        id: 'postgres',
        name: HOMEPAGE_STRINGS.blockPostgresName,
        category: HOMEPAGE_STRINGS.blockPostgresCategory,
        desc: HOMEPAGE_STRINGS.blockPostgresDesc,
        port: 5432,
        uiPort: 5050,
        security: HOMEPAGE_STRINGS.blockPostgresSecurity,
        storage: HOMEPAGE_STRINGS.blockPostgresVolume,
        accentColor: '#10b981', // Emerald
        glowColor: 'rgba(16, 185, 129, 0.45)',
        borderColor: 'rgba(16, 185, 129, 0.5)',
        bgFace: 'rgba(6, 78, 59, 0.4)',
        icon: <Database className="w-5 h-5 text-emerald-400" />,
        coords: { x: -140, y: -40, z: 70 },
        explodedCoords: { x: -220, y: -110, z: 140 },
      },
      {
        id: 'redis',
        name: HOMEPAGE_STRINGS.blockRedisName,
        category: HOMEPAGE_STRINGS.blockRedisCategory,
        desc: HOMEPAGE_STRINGS.blockRedisDesc,
        port: 6379,
        uiPort: 8082,
        security: HOMEPAGE_STRINGS.blockRedisSecurity,
        storage: HOMEPAGE_STRINGS.blockRedisVolume,
        accentColor: '#f43f5e', // Rose
        glowColor: 'rgba(244, 63, 94, 0.45)',
        borderColor: 'rgba(244, 63, 94, 0.5)',
        bgFace: 'rgba(136, 19, 55, 0.4)',
        icon: <Zap className="w-5 h-5 text-rose-400" />,
        coords: { x: 130, y: -45, z: 80 },
        explodedCoords: { x: 210, y: -110, z: 150 },
      },
      {
        id: 'kafka',
        name: HOMEPAGE_STRINGS.blockKafkaName,
        category: HOMEPAGE_STRINGS.blockKafkaCategory,
        desc: HOMEPAGE_STRINGS.blockKafkaDesc,
        port: 9092,
        uiPort: 8080,
        security: HOMEPAGE_STRINGS.blockKafkaSecurity,
        storage: HOMEPAGE_STRINGS.blockKafkaVolume,
        accentColor: '#0ea5e9', // Sky
        glowColor: 'rgba(14, 165, 233, 0.45)',
        borderColor: 'rgba(14, 165, 233, 0.5)',
        bgFace: 'rgba(12, 74, 110, 0.4)',
        icon: <Layers className="w-5 h-5 text-sky-400" />,
        coords: { x: 0, y: -90, z: -80 },
        explodedCoords: { x: 0, y: -170, z: -150 },
      },
      {
        id: 'keycloak',
        name: HOMEPAGE_STRINGS.blockKeycloakName,
        category: HOMEPAGE_STRINGS.blockKeycloakCategory,
        desc: HOMEPAGE_STRINGS.blockKeycloakDesc,
        port: 8080,
        security: HOMEPAGE_STRINGS.blockKeycloakSecurity,
        storage: HOMEPAGE_STRINGS.blockKeycloakVolume,
        accentColor: '#f59e0b', // Amber
        glowColor: 'rgba(245, 158, 11, 0.45)',
        borderColor: 'rgba(245, 158, 11, 0.5)',
        bgFace: 'rgba(120, 53, 15, 0.4)',
        icon: <Key className="w-5 h-5 text-amber-400" />,
        coords: { x: -130, y: 55, z: -70 },
        explodedCoords: { x: -210, y: 110, z: -130 },
      },
      {
        id: 'merkle',
        name: HOMEPAGE_STRINGS.blockMerkleName,
        category: HOMEPAGE_STRINGS.blockMerkleCategory,
        desc: HOMEPAGE_STRINGS.blockMerkleDesc,
        port: 5001,
        security: HOMEPAGE_STRINGS.blockMerkleSecurity,
        storage: HOMEPAGE_STRINGS.blockMerkleVolume,
        accentColor: '#a855f7', // Purple
        glowColor: 'rgba(168, 85, 247, 0.45)',
        borderColor: 'rgba(168, 85, 247, 0.5)',
        bgFace: 'rgba(88, 28, 135, 0.4)',
        icon: <ShieldCheck className="w-5 h-5 text-purple-400" />,
        coords: { x: 140, y: 50, z: -60 },
        explodedCoords: { x: 220, y: 110, z: -120 },
      },
      {
        id: 'docker',
        name: HOMEPAGE_STRINGS.blockDockerName,
        category: HOMEPAGE_STRINGS.blockDockerCategory,
        desc: HOMEPAGE_STRINGS.blockDockerDesc,
        port: 2375,
        security: HOMEPAGE_STRINGS.blockDockerSecurity,
        storage: HOMEPAGE_STRINGS.blockDockerVolume,
        accentColor: '#38bdf8', // Light Cyan
        glowColor: 'rgba(56, 189, 248, 0.45)',
        borderColor: 'rgba(56, 189, 248, 0.5)',
        bgFace: 'rgba(14, 116, 144, 0.4)',
        icon: <Cpu className="w-5 h-5 text-cyan-400" />,
        coords: { x: 0, y: 20, z: 0 }, // Center Hub Core
        explodedCoords: { x: 0, y: 0, z: 0 },
      },
    ],
    []
  );

  // Auto-rotation loop
  useEffect(() => {
    if (!isAutoRotate || isDragging) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.35) % 360);
    }, 28);
    return () => clearInterval(interval);
  }, [isAutoRotate, isDragging]);

  // Particle Starfield / Geometric Grid Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const width = (canvas.width = canvas.parentElement?.clientWidth || 800);
    const height = (canvas.height = canvas.parentElement?.clientHeight || 560);

    // Particle nodes
    const particleCount = 42;
    const particles = Array.from({ length: particleCount }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.45,
      vy: (Math.random() - 0.5) * 0.45,
      radius: Math.random() * 1.6 + 0.6,
      alpha: Math.random() * 0.5 + 0.2,
    }));

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Connect lines between nearby particles
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 110) {
            ctx.beginPath();
            ctx.strokeStyle = `rgba(14, 165, 233, ${0.15 * (1 - dist / 110)})`;
            ctx.lineWidth = 0.6;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw and move particles
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;

        if (p.x < 0 || p.x > width) p.vx *= -1;
        if (p.y < 0 || p.y > height) p.vy *= -1;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(56, 189, 248, ${p.alpha})`;
        ctx.fill();
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animId);
  }, []);

  // Mouse drag camera controls
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({
      x: e.clientX,
      y: e.clientY,
      startRotX: rotX,
      startRotY: rotY,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Constrain pitch (X) to avoid upside down disorientation
    const newRotX = Math.max(-15, Math.min(65, dragStart.startRotX - deltaY * 0.35));
    const newRotY = (dragStart.startRotY + deltaX * 0.45) % 360;

    setRotX(newRotX);
    setRotY(newRotY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetCamera = () => {
    setRotX(22);
    setRotY(-26);
    setIsAutoRotate(true);
  };

  return (
    <div className="relative w-full rounded-3xl overflow-hidden bg-[#070b12] border border-white/[0.08] shadow-[0_20px_70px_rgba(0,0,0,0.85)]">
      {/* Background Interactive Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 pointer-events-none z-0 opacity-70"
      />

      {/* Floating 3D Horizon Grid Background */}
      <div className="absolute inset-0 cyber-grid-3d opacity-20 pointer-events-none [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_60%,transparent_100%)]" />

      {/* Camera Control Toolbar (Top Right) */}
      <div className="absolute top-4 right-4 z-30 flex items-center space-x-2 bg-black/60 backdrop-blur-xl p-1.5 rounded-2xl border border-white/[0.08] shadow-lg">
        <button
          onClick={() => setIsAutoRotate(!isAutoRotate)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isAutoRotate
              ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title={isAutoRotate ? HOMEPAGE_STRINGS.pauseRotateButton : HOMEPAGE_STRINGS.autoRotateButton}
        >
          {isAutoRotate ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">
            {isAutoRotate ? HOMEPAGE_STRINGS.pauseRotateButton : HOMEPAGE_STRINGS.autoRotateButton}
          </span>
        </button>

        <button
          onClick={() => setIsExploded(!isExploded)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
            isExploded
              ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30 shadow-sm'
              : 'text-slate-400 hover:text-white hover:bg-white/[0.05]'
          }`}
          title={isExploded ? HOMEPAGE_STRINGS.compactViewButton : HOMEPAGE_STRINGS.explodedViewButton}
        >
          <Box className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">
            {isExploded ? HOMEPAGE_STRINGS.compactViewButton : HOMEPAGE_STRINGS.explodedViewButton}
          </span>
        </button>

        <button
          onClick={resetCamera}
          className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/[0.05] transition-all"
          title={HOMEPAGE_STRINGS.resetCameraButton}
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Floating Status Badge (Top Left) */}
      <div className="absolute top-4 left-4 z-30 flex items-center space-x-2 bg-black/60 backdrop-blur-xl px-3.5 py-1.5 rounded-2xl border border-white/[0.08]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[11px] font-mono text-slate-300">
          {HOMEPAGE_STRINGS.meshBadge(6)}
        </span>
      </div>

      {/* 3D Perspective Stage Viewport */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[520px] sm:h-[580px] perspective-stage flex items-center justify-center select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        {/* The 3D World Transform Group */}
        <div
          className="preserve-3d relative w-0 h-0 transition-transform duration-75"
          style={{
            transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
          }}
        >
          {/* Ground Plane Grid Disc */}
          <div
            className="absolute -top-[250px] -left-[250px] w-[500px] h-[500px] rounded-full preserve-3d pointer-events-none"
            style={{
              transform: 'rotateX(90deg) translateZ(-130px)',
              background: 'radial-gradient(circle, rgba(14,165,233,0.12) 0%, rgba(99,102,241,0.05) 50%, transparent 75%)',
              border: '1px solid rgba(255,255,255,0.06)',
              boxShadow: '0 0 80px rgba(14,165,233,0.1)',
            }}
          >
            {/* Concentric telemetry rings */}
            <div className="absolute inset-8 rounded-full border border-sky-500/10" />
            <div className="absolute inset-24 rounded-full border border-dashed border-sky-500/15" />
            <div className="absolute inset-40 rounded-full border border-sky-500/10" />
          </div>

          {/* Render All 6 3D Isometric Prism Cubes */}
          {blocks.map((block) => {
            const isSelected = selectedBlockId === block.id;
            const isHovered = hoveredBlockId === block.id;
            const isRunning = runningServiceIds.includes(block.id);

            const pos = isExploded ? block.explodedCoords : block.coords;
            const liftZ = isSelected ? 35 : isHovered ? 20 : 0;

            // Prism dimensions
            const cubeSize = 96; // 96x96x70 px
            const halfSize = cubeSize / 2;
            const depth = 64;
            const halfDepth = depth / 2;

            return (
              <div
                key={block.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock?.(block.id);
                }}
                onMouseEnter={() => setHoveredBlockId(block.id)}
                onMouseLeave={() => setHoveredBlockId(null)}
                style={{
                  transform: `translate3d(${pos.x}px, ${pos.y}px, ${pos.z + liftZ}px)`,
                  transition: isDragging
                    ? 'none'
                    : 'transform 0.45s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.3s ease',
                  cursor: 'pointer',
                }}
                className="absolute -top-[48px] -left-[48px] w-[96px] h-[96px] preserve-3d group"
              >
                {/* 3D Face: FRONT */}
                <div
                  style={{
                    transform: `translateZ(${halfDepth}px)`,
                    borderColor: isSelected ? block.accentColor : block.borderColor,
                    backgroundColor: block.bgFace,
                    boxShadow: isSelected
                      ? `0 0 35px ${block.glowColor}, inset 0 0 20px ${block.glowColor}`
                      : isHovered
                      ? `0 0 20px ${block.glowColor}`
                      : 'none',
                  }}
                  className="absolute inset-0 rounded-2xl border-2 backdrop-blur-md p-2.5 flex flex-col justify-between backface-hidden transition-all duration-300 select-none"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="p-1.5 rounded-xl shadow-inner border border-white/20"
                      style={{ backgroundColor: `${block.accentColor}25` }}
                    >
                      {block.icon}
                    </div>

                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold border"
                      style={{
                        backgroundColor: `${block.accentColor}20`,
                        color: block.accentColor,
                        borderColor: `${block.accentColor}40`,
                      }}
                    >
                      :{block.port}
                    </span>
                  </div>

                  <div>
                    <h5 className="text-[11px] font-bold text-white leading-tight truncate">
                      {block.name}
                    </h5>
                    <div className="flex items-center justify-between mt-0.5 text-[9px] font-mono text-slate-400">
                      <span className="truncate">{block.category}</span>
                      {isRunning && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3D Face: TOP ROOF */}
                <div
                  style={{
                    transform: `rotateX(90deg) translateZ(${halfDepth}px)`,
                    height: `${depth}px`,
                    top: `${halfSize - halfDepth}px`,
                    borderColor: isSelected ? block.accentColor : block.borderColor,
                    backgroundColor: `${block.accentColor}20`,
                  }}
                  className="absolute left-0 right-0 rounded-xl border border-white/[0.15] backdrop-blur-md backface-hidden transition-all duration-300"
                >
                  {/* Subtle circuit line on roof */}
                  <div className="w-full h-full flex items-center justify-center opacity-40">
                    <div
                      className="w-8 h-8 rounded-lg border border-dashed"
                      style={{ borderColor: block.accentColor }}
                    />
                  </div>
                </div>

                {/* 3D Face: RIGHT WALL */}
                <div
                  style={{
                    transform: `rotateY(90deg) translateZ(${halfSize}px)`,
                    width: `${depth}px`,
                    left: `${halfSize - halfDepth}px`,
                    borderColor: isSelected ? block.accentColor : block.borderColor,
                    backgroundColor: `${block.accentColor}15`,
                  }}
                  className="absolute top-0 bottom-0 rounded-xl border border-white/[0.12] backdrop-blur-md backface-hidden transition-all duration-300"
                />

                {/* 3D Face: LEFT WALL */}
                <div
                  style={{
                    transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
                    width: `${depth}px`,
                    left: `${halfSize - halfDepth}px`,
                    borderColor: isSelected ? block.accentColor : block.borderColor,
                    backgroundColor: `${block.accentColor}15`,
                  }}
                  className="absolute top-0 bottom-0 rounded-xl border border-white/[0.12] backdrop-blur-md backface-hidden transition-all duration-300"
                />

                {/* Ground Shadow Cast */}
                <div
                  style={{
                    transform: `rotateX(90deg) translateZ(-80px)`,
                    background: `radial-gradient(circle, ${block.glowColor} 0%, transparent 70%)`,
                    opacity: isSelected ? 0.9 : 0.5,
                  }}
                  className="absolute -inset-4 rounded-full pointer-events-none transition-opacity duration-300"
                />

                {/* Selection Halo Ring */}
                {isSelected && (
                  <div
                    style={{
                      transform: 'rotateX(90deg) translateZ(-40px)',
                      borderColor: block.accentColor,
                      boxShadow: `0 0 25px ${block.glowColor}`,
                    }}
                    className="absolute -inset-6 rounded-full border-2 border-dashed animate-spin [animation-duration:12s] pointer-events-none"
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Interactive Navigation / Hint Bar */}
      <div className="relative z-30 px-6 py-3.5 bg-black/40 border-t border-white/[0.08] backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2 text-slate-400 text-[11px]">
          <Sparkles className="w-3.5 h-3.5 text-sky-400 shrink-0" />
          <span>{HOMEPAGE_STRINGS.dragHint}</span>
        </div>

        {/* Quick Block Selector Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {blocks.map((b) => (
            <button
              key={b.id}
              onClick={() => onSelectBlock?.(b.id)}
              className={`px-2.5 py-1 rounded-xl text-[11px] font-medium transition-all ${
                selectedBlockId === b.id
                  ? 'bg-white/[0.15] text-white shadow-sm border border-white/[0.2]'
                  : 'text-slate-400 hover:text-white hover:bg-white/[0.04]'
              }`}
            >
              {b.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
