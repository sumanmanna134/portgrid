import React, { useState, useEffect } from 'react';
import { Check, ShieldCheck, Sparkles } from 'lucide-react';
import { INSTALL_MODAL_STRINGS } from '../constants/strings';

interface DeployingCube3DProps {
  step: number; // 1 to 5, or 6 for completed
  progress: number; // 0 to 100
  accentColor?: string;
  icon: React.ReactNode;
  serviceName: string;
  port?: number;
}

export const DeployingCube3D: React.FC<DeployingCube3DProps> = ({
  step,
  progress,
  accentColor = '#0ea5e9',
  icon,
  serviceName,
  port = 8080,
}) => {
  const [rotX, setRotX] = useState<number>(18);
  const [rotY, setRotY] = useState<number>(-22);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 18,
    startRotY: -22,
  });

  // Calm idle yaw drift
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.3) % 360);
    }, 35);
    return () => clearInterval(interval);
  }, [isDragging]);

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
    const newRotX = Math.max(-15, Math.min(45, dragStart.startRotX - deltaY * 0.35));
    const newRotY = (dragStart.startRotY + deltaX * 0.45) % 360;
    setRotX(newRotX);
    setRotY(newRotY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch support for tablets / laptops
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startRotX: rotX,
        startRotY: rotY,
      });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const deltaX = e.touches[0].clientX - dragStart.x;
    const deltaY = e.touches[0].clientY - dragStart.y;
    const newRotX = Math.max(-15, Math.min(45, dragStart.startRotX - deltaY * 0.35));
    const newRotY = (dragStart.startRotY + deltaX * 0.45) % 360;
    setRotX(newRotX);
    setRotY(newRotY);
  };

  // Dimensions: 96x96x72 px
  const cubeSize = 96;
  const halfSize = cubeSize / 2;
  const depth = 72;
  const halfDepth = depth / 2;

  const isWireframe = step === 1;
  const isSolid = step >= 3;
  const isMerkleSealed = step >= 5;
  const isDone = step >= 6 || progress >= 100;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className={`relative w-full h-44 sm:h-48 perspective-stage flex items-center justify-center select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Ambient Floor Glow */}
      <div
        className="absolute w-56 h-56 rounded-full pointer-events-none transition-all duration-700 opacity-40"
        style={{
          background: `radial-gradient(circle, ${accentColor}30 0%, transparent 70%)`,
          filter: 'blur(32px)',
          transform: `scale(${isDone ? 1.15 : 0.95})`,
        }}
      />

      {/* 3D World Transform Group */}
      <div
        className="preserve-3d relative w-0 h-0 transition-transform duration-75"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* Soft Floor Shadow Plane */}
        <div
          className="absolute -top-[90px] -left-[90px] w-[180px] h-[180px] rounded-full preserve-3d pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(-80px)',
            background: `radial-gradient(circle, rgba(0,0,0,0.6) 0%, transparent 65%)`,
          }}
        />

        {/* 3D CUBE CONTAINER */}
        <div
          className={`absolute -top-[48px] -left-[48px] w-[96px] h-[96px] preserve-3d transition-all duration-500 ${
            isDone ? 'animate-float-3d' : ''
          }`}
          style={{
            transform: `translate3d(0, ${isDone ? -6 : 0}px, 0)`,
          }}
        >
          {/* FACE 1: FRONT */}
          <div
            style={{
              transform: `translateZ(${halfDepth}px)`,
              borderColor: isWireframe ? `${accentColor}50` : 'rgba(255, 255, 255, 0.12)',
              backgroundColor: isSolid ? 'rgba(12, 17, 29, 0.85)' : 'rgba(10, 14, 24, 0.55)',
              boxShadow: isDone
                ? `0 0 24px ${accentColor}40, inset 0 0 16px ${accentColor}20`
                : '0 4px 20px rgba(0, 0, 0, 0.4)',
            }}
            className={`absolute inset-0 rounded-2xl border backdrop-blur-md p-2.5 flex flex-col justify-between backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="w-7 h-7 rounded-lg border flex items-center justify-center transition-all duration-300"
                style={{
                  backgroundColor: `${accentColor}18`,
                  borderColor: `${accentColor}35`,
                }}
              >
                {icon}
              </div>

              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-md font-medium bg-white/[0.04] border border-white/[0.08] text-slate-300">
                :{port}
              </span>
            </div>

            <div>
              <h4 className="text-[11px] font-semibold text-white tracking-tight truncate">
                {serviceName}
              </h4>
              <div className="flex items-center justify-between mt-1 text-[9px] font-mono">
                <span className="text-slate-400">{Math.round(progress)}%</span>
                {isDone ? (
                  <span className="inline-flex items-center gap-0.5 text-emerald-400 font-medium">
                    <Check className="w-2.5 h-2.5" />
                    <span>{INSTALL_MODAL_STRINGS.cubeReadyBadge}</span>
                  </span>
                ) : (
                  <span
                    className="w-1.5 h-1.5 rounded-full animate-ping"
                    style={{ backgroundColor: accentColor }}
                  />
                )}
              </div>
            </div>
          </div>

          {/* FACE 2: BACK */}
          <div
            style={{
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backgroundColor: isSolid ? 'rgba(10, 15, 26, 0.75)' : 'rgba(8, 12, 20, 0.45)',
            }}
            className={`absolute inset-0 rounded-2xl border backdrop-blur-md p-2.5 flex flex-col justify-between backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            <div className="text-[8px] font-mono text-slate-500 tracking-wider uppercase font-semibold">
              {INSTALL_MODAL_STRINGS.cubeEnclaveFace}
            </div>
            <div className="text-[8px] font-mono text-slate-400">
              {INSTALL_MODAL_STRINGS.cubeBindingFace}
            </div>
          </div>

          {/* FACE 3: TOP (ROOF) */}
          <div
            style={{
              transform: `rotateX(90deg) translateZ(${halfDepth}px)`,
              height: `${depth}px`,
              top: `${halfSize - halfDepth}px`,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              backgroundColor: isSolid ? 'rgba(15, 22, 38, 0.85)' : 'rgba(10, 14, 24, 0.5)',
              boxShadow: isMerkleSealed ? `0 0 16px ${accentColor}30` : 'none',
            }}
            className={`absolute left-0 right-0 rounded-xl border backdrop-blur-md backface-hidden flex items-center justify-center transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            {isMerkleSealed ? (
              <div className="flex items-center space-x-1 text-white font-mono text-[8px] font-medium bg-black/60 px-1.5 py-0.5 rounded-md border border-white/10">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                <span>{INSTALL_MODAL_STRINGS.cubeSealBadge}</span>
              </div>
            ) : (
              <div
                className="w-6 h-6 rounded-md border border-dashed opacity-30"
                style={{ borderColor: accentColor }}
              />
            )}
          </div>

          {/* FACE 4: BOTTOM */}
          <div
            style={{
              transform: `rotateX(-90deg) translateZ(${halfDepth}px)`,
              height: `${depth}px`,
              top: `${halfSize - halfDepth}px`,
              borderColor: 'rgba(255, 255, 255, 0.05)',
              backgroundColor: 'rgba(6, 9, 16, 0.6)',
            }}
            className="absolute left-0 right-0 rounded-xl border border-dashed backdrop-blur-md backface-hidden"
          />

          {/* FACE 5: RIGHT WALL */}
          <div
            style={{
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
              width: `${depth}px`,
              left: `${halfSize - halfDepth}px`,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backgroundColor: isSolid ? 'rgba(12, 18, 30, 0.75)' : 'rgba(8, 12, 22, 0.45)',
            }}
            className={`absolute top-0 bottom-0 rounded-xl border backdrop-blur-md backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          />

          {/* FACE 6: LEFT WALL */}
          <div
            style={{
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
              width: `${depth}px`,
              left: `${halfSize - halfDepth}px`,
              borderColor: 'rgba(255, 255, 255, 0.08)',
              backgroundColor: isSolid ? 'rgba(12, 18, 30, 0.75)' : 'rgba(8, 12, 22, 0.45)',
            }}
            className={`absolute top-0 bottom-0 rounded-xl border backdrop-blur-md backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          />
        </div>
      </div>

      {/* Discrete Drag Rotate Hint Pill */}
      <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 text-[10px] font-mono text-slate-500 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-white/[0.06] flex items-center gap-1.5 pointer-events-none">
        <Sparkles className="w-2.5 h-2.5 text-sky-400/80" />
        <span>{INSTALL_MODAL_STRINGS.dragHintClean}</span>
      </div>
    </div>
  );
};
