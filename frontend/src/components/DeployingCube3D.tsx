import React, { useState, useRef, useEffect } from 'react';
import { Check, ShieldCheck, Lock, Activity, Sparkles, Terminal } from 'lucide-react';
import { INSTALL_MODAL_STRINGS } from '../constants/strings';

interface DeployingCube3DProps {
  step: number; // 1 to 5 (or 6 for completed)
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
  const [rotX, setRotX] = useState<number>(20);
  const [rotY, setRotY] = useState<number>(-25);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; startRotX: number; startRotY: number }>({
    x: 0,
    y: 0,
    startRotX: 20,
    startRotY: -25,
  });

  // Idle smooth rotation around Y axis
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.45) % 360);
    }, 30);
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
    const newRotX = Math.max(-25, Math.min(65, dragStart.startRotX - deltaY * 0.4));
    const newRotY = (dragStart.startRotY + deltaX * 0.5) % 360;
    setRotX(newRotX);
    setRotY(newRotY);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Cube dimensions
  const cubeSize = 110; // 110x110x80 px
  const halfSize = cubeSize / 2;
  const depth = 80;
  const halfDepth = depth / 2;

  const isWireframe = step === 1;
  const isCryptoActive = step >= 2;
  const isSolid = step >= 3;
  const isSocketReady = step >= 4;
  const isMerkleSealed = step >= 5;
  const isDone = step >= 6 || progress >= 100;

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      className={`relative w-full h-64 perspective-stage flex items-center justify-center select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Background Radial Glow */}
      <div
        className="absolute w-72 h-72 rounded-full pointer-events-none transition-all duration-700"
        style={{
          background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
          filter: 'blur(20px)',
          transform: `scale(${isDone ? 1.25 : 1})`,
        }}
      />

      {/* 3D World Transform Group */}
      <div
        className="preserve-3d relative w-0 h-0 transition-transform duration-75"
        style={{
          transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`,
        }}
      >
        {/* 3D Ground Shadow & Sonar Ripple */}
        <div
          className="absolute -top-[120px] -left-[120px] w-[240px] h-[240px] rounded-full preserve-3d pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(-110px)',
            background: `radial-gradient(circle, ${accentColor}35 0%, transparent 70%)`,
          }}
        >
          {/* Concentric rings */}
          <div
            className="absolute inset-4 rounded-full border border-dashed transition-colors duration-500"
            style={{ borderColor: `${accentColor}40` }}
          />
          {/* Sonar pulse ring when socket is ready */}
          {isSocketReady && (
            <div
              className="absolute inset-0 rounded-full border-2 animate-ping"
              style={{ borderColor: accentColor }}
            />
          )}
        </div>

        {/* Orbiting Cryptographic Tokens Ring (Step 2+) */}
        {isCryptoActive && (
          <div
            className="absolute -top-[100px] -left-[100px] w-[200px] h-[200px] rounded-full preserve-3d pointer-events-none animate-spin [animation-duration:14s]"
            style={{
              transform: 'rotateX(65deg) rotateZ(35deg)',
              border: `1px dashed ${accentColor}60`,
            }}
          >
            {/* Orbiting token nodes */}
            <span
              className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/80 font-bold border shadow-lg"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              {INSTALL_MODAL_STRINGS.tokenAes256}
            </span>
            <span
              className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/80 font-bold border shadow-lg"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              {INSTALL_MODAL_STRINGS.tokenFips140}
            </span>
            <span
              className="absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-black/80 font-bold border shadow-lg"
              style={{ color: accentColor, borderColor: accentColor }}
            >
              {INSTALL_MODAL_STRINGS.tokenSha256}
            </span>
          </div>
        )}

        {/* THE 3D CUBE CONTAINER */}
        <div
          className={`absolute -top-[55px] -left-[55px] w-[110px] h-[110px] preserve-3d transition-transform duration-500 ${
            isDone ? 'animate-float-3d' : ''
          }`}
          style={{
            transform: `translate3d(0, ${isDone ? -10 : 0}px, 0)`,
          }}
        >
          {/* Laser Scanning Plane (Moving vertically across cube in steps 1-3) */}
          {!isDone && (
            <div
              className="absolute left-0 right-0 h-1 pointer-events-none preserve-3d transition-all duration-300 animate-pulse"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}, #fff, ${accentColor}, transparent)`,
                boxShadow: `0 0 15px ${accentColor}`,
                transform: `rotateX(90deg) translateZ(${Math.sin(Date.now() / 300) * 40}px)`,
              }}
            />
          )}

          {/* 3D FACE 1: FRONT */}
          <div
            style={{
              transform: `translateZ(${halfDepth}px)`,
              borderColor: isWireframe ? `${accentColor}70` : accentColor,
              backgroundColor: isSolid ? `${accentColor}25` : 'rgba(0, 0, 0, 0.6)',
              boxShadow: isDone
                ? `0 0 35px ${accentColor}80, inset 0 0 25px ${accentColor}40`
                : `0 0 20px ${accentColor}30`,
            }}
            className={`absolute inset-0 rounded-2xl border-2 backdrop-blur-md p-3 flex flex-col justify-between backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            <div className="flex items-center justify-between">
              <div
                className="p-2 rounded-xl border shadow-inner transition-transform duration-300"
                style={{
                  backgroundColor: `${accentColor}30`,
                  borderColor: `${accentColor}50`,
                }}
              >
                {icon}
              </div>

              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold border"
                style={{
                  backgroundColor: `${accentColor}25`,
                  color: accentColor,
                  borderColor: `${accentColor}50`,
                }}
              >
                :{port}
              </span>
            </div>

            <div>
              <h4 className="text-xs font-bold text-white leading-tight truncate">
                {serviceName}
              </h4>
              <div className="flex items-center justify-between mt-1 text-[10px] font-mono">
                <span className="text-slate-300 font-semibold">{Math.round(progress)}%</span>
                {isDone ? (
                  <span className="inline-flex items-center gap-1 text-emerald-400 font-bold">
                    <Check className="w-3 h-3" /> {INSTALL_MODAL_STRINGS.cubeReadyBadge}
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: accentColor }} />
                )}
              </div>
            </div>
          </div>

          {/* 3D FACE 2: BACK */}
          <div
            style={{
              transform: `rotateY(180deg) translateZ(${halfDepth}px)`,
              borderColor: `${accentColor}50`,
              backgroundColor: isSolid ? `${accentColor}20` : 'rgba(0, 0, 0, 0.6)',
            }}
            className={`absolute inset-0 rounded-2xl border backdrop-blur-md p-3 flex flex-col justify-between backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            <div className="text-[10px] font-mono text-slate-400 font-bold">{INSTALL_MODAL_STRINGS.cubeEnclaveFace}</div>
            <div className="text-[9px] font-mono text-slate-300">{INSTALL_MODAL_STRINGS.cubeBindingFace}</div>
          </div>

          {/* 3D FACE 3: TOP (ROOF) with Merkle Stamp */}
          <div
            style={{
              transform: `rotateX(90deg) translateZ(${halfDepth}px)`,
              height: `${depth}px`,
              top: `${halfSize - halfDepth}px`,
              borderColor: `${accentColor}60`,
              backgroundColor: isSolid ? `${accentColor}30` : 'rgba(0, 0, 0, 0.5)',
              boxShadow: isMerkleSealed ? `0 0 25px ${accentColor}60` : 'none',
            }}
            className={`absolute left-0 right-0 rounded-xl border backdrop-blur-md backface-hidden flex items-center justify-center transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          >
            {isMerkleSealed ? (
              <div className="flex items-center space-x-1.5 text-white font-mono text-[9px] font-bold bg-black/60 px-2 py-0.5 rounded-lg border border-white/20">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>{INSTALL_MODAL_STRINGS.cubeSealBadge}</span>
              </div>
            ) : (
              <div
                className="w-10 h-10 rounded-lg border border-dashed opacity-40"
                style={{ borderColor: accentColor }}
              />
            )}
          </div>

          {/* 3D FACE 4: BOTTOM */}
          <div
            style={{
              transform: `rotateX(-90deg) translateZ(${halfDepth}px)`,
              height: `${depth}px`,
              top: `${halfSize - halfDepth}px`,
              borderColor: `${accentColor}40`,
              backgroundColor: `${accentColor}20`,
            }}
            className="absolute left-0 right-0 rounded-xl border border-dashed backdrop-blur-md backface-hidden"
          />

          {/* 3D FACE 5: RIGHT WALL */}
          <div
            style={{
              transform: `rotateY(90deg) translateZ(${halfSize}px)`,
              width: `${depth}px`,
              left: `${halfSize - halfDepth}px`,
              borderColor: `${accentColor}50`,
              backgroundColor: isSolid ? `${accentColor}25` : 'rgba(0, 0, 0, 0.5)',
            }}
            className={`absolute top-0 bottom-0 rounded-xl border backdrop-blur-md backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          />

          {/* 3D FACE 6: LEFT WALL */}
          <div
            style={{
              transform: `rotateY(-90deg) translateZ(${halfSize}px)`,
              width: `${depth}px`,
              left: `${halfSize - halfDepth}px`,
              borderColor: `${accentColor}50`,
              backgroundColor: isSolid ? `${accentColor}25` : 'rgba(0, 0, 0, 0.5)',
            }}
            className={`absolute top-0 bottom-0 rounded-xl border backdrop-blur-md backface-hidden transition-all duration-500 ${
              isWireframe ? 'border-dashed' : 'border-solid'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
