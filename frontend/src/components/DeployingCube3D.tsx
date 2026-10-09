import React, { useState, useEffect } from 'react';
import {
  Network,
  Lock,
  Cpu,
  Activity,
  ShieldCheck,
  Check,
  Layers,
} from 'lucide-react';
import { INSTALL_MODAL_STRINGS } from '../constants/strings';

interface DeployingCube3DProps {
  step: number; // 1 to 5, 6 is completed
  progress: number; // 0 to 100
  accentColor?: string;
  icon: React.ReactNode;
  serviceName: string;
  port?: number;
  selectedBlockIndex: number;
  onSelectBlock: (index: number) => void;
}

export const DeployingCube3D: React.FC<DeployingCube3DProps> = ({
  step,
  progress,
  accentColor = '#0ea5e9',
  icon,
  serviceName,
  port = 8080,
  selectedBlockIndex,
  onSelectBlock,
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

  // Calm idle yaw drift
  useEffect(() => {
    if (isDragging) return;
    const interval = setInterval(() => {
      setRotY((prev) => (prev + 0.25) % 360);
    }, 40);
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

  const isDone = step >= 6 || progress >= 100;

  // 5 Architectural Blocks in the Enclave Stack (stacked vertically: layer 0 at bottom to layer 4 at top)
  const blocks = [
    {
      id: 1,
      title: INSTALL_MODAL_STRINGS.block1Title,
      spec: INSTALL_MODAL_STRINGS.block1Spec,
      icon: <Network className="w-3.5 h-3.5 text-sky-400" />,
      color: '#0ea5e9',
      yOffset: 48, // Base layer
    },
    {
      id: 2,
      title: INSTALL_MODAL_STRINGS.block2Title,
      spec: INSTALL_MODAL_STRINGS.block2Spec,
      icon: <Lock className="w-3.5 h-3.5 text-amber-400" />,
      color: '#f59e0b',
      yOffset: 24,
    },
    {
      id: 3,
      title: INSTALL_MODAL_STRINGS.block3Title,
      spec: INSTALL_MODAL_STRINGS.block3Spec,
      icon: <Cpu className="w-3.5 h-3.5 text-emerald-400" />,
      color: '#10b981',
      yOffset: 0, // Middle container runtime
    },
    {
      id: 4,
      title: INSTALL_MODAL_STRINGS.block4Title,
      spec: `${INSTALL_MODAL_STRINGS.block4Spec} (:${port})`,
      icon: <Activity className="w-3.5 h-3.5 text-cyan-400" />,
      color: '#06b6d4',
      yOffset: -24,
    },
    {
      id: 5,
      title: INSTALL_MODAL_STRINGS.block5Title,
      spec: INSTALL_MODAL_STRINGS.block5Spec,
      icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />,
      color: '#34d399',
      yOffset: -48, // Top Merkle seal
    },
  ];

  return (
    <div
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleMouseUp}
      className={`relative w-full h-56 perspective-stage flex items-center justify-center select-none overflow-hidden ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      }`}
    >
      {/* Subtle Ambient Ground Glow */}
      <div
        className="absolute w-52 h-52 rounded-full pointer-events-none transition-all duration-700 opacity-25"
        style={{
          background: `radial-gradient(circle, ${accentColor}25 0%, transparent 70%)`,
          filter: 'blur(32px)',
          transform: `scale(${isDone ? 1.1 : 0.95})`,
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
          className="absolute -top-[80px] -left-[80px] w-[160px] h-[160px] rounded-full preserve-3d pointer-events-none"
          style={{
            transform: 'rotateX(90deg) translateZ(-85px)',
            background: 'radial-gradient(circle, rgba(0,0,0,0.55) 0%, transparent 65%)',
          }}
        />

        {/* 3D MODULAR BLOCK-BY-BLOCK ENCLAVE STACK */}
        <div
          className={`preserve-3d transition-transform duration-500 ${
            isDone ? 'animate-float-3d' : ''
          }`}
        >
          {blocks.map((blk, idx) => {
            const isAssembled = step >= blk.id;
            const isSelected = selectedBlockIndex === idx;
            const blockWidth = 120;
            const blockHeight = 22;
            const blockDepth = 90;

            return (
              <div
                key={blk.id}
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBlock(idx);
                }}
                className={`preserve-3d absolute -left-[60px] cursor-pointer transition-all duration-500`}
                style={{
                  top: `${blk.yOffset}px`,
                  opacity: isAssembled ? 1 : 0.35,
                  transform: `translate3d(0, ${isAssembled ? 0 : -35}px, 0) scale3d(${
                    isSelected ? 1.05 : 1
                  }, ${isSelected ? 1.05 : 1}, ${isSelected ? 1.05 : 1})`,
                }}
              >
                {/* FRONT FACE */}
                <div
                  style={{
                    width: `${blockWidth}px`,
                    height: `${blockHeight}px`,
                    transform: `translateZ(${blockDepth / 2}px)`,
                    borderColor: isSelected
                      ? '#38bdf8'
                      : isAssembled
                      ? 'rgba(255, 255, 255, 0.16)'
                      : 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: isAssembled
                      ? isSelected
                        ? 'rgba(14, 165, 233, 0.35)'
                        : 'rgba(11, 16, 28, 0.88)'
                      : 'rgba(11, 16, 28, 0.3)',
                    boxShadow: isSelected
                      ? '0 0 16px rgba(14, 165, 233, 0.4)'
                      : '0 2px 8px rgba(0,0,0,0.4)',
                  }}
                  className={`absolute rounded-lg border backdrop-blur-md px-2 flex items-center justify-between transition-colors`}
                >
                  <div className="flex items-center space-x-1.5 truncate">
                    <span className="shrink-0">{blk.icon}</span>
                    <span className="text-[10px] font-medium text-slate-200 truncate">
                      {blk.title}
                    </span>
                  </div>

                  {isAssembled && (
                    <span className="shrink-0 text-[8px] font-mono text-emerald-400 font-semibold flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* BACK FACE */}
                <div
                  style={{
                    width: `${blockWidth}px`,
                    height: `${blockHeight}px`,
                    transform: `rotateY(180deg) translateZ(${blockDepth / 2}px)`,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(9, 14, 24, 0.8)',
                  }}
                  className="absolute rounded-lg border backdrop-blur-md"
                />

                {/* TOP FACE */}
                <div
                  style={{
                    width: `${blockWidth}px`,
                    height: `${blockDepth}px`,
                    transform: `rotateX(90deg) translateZ(${blockDepth / 2}px)`,
                    top: `${(blockHeight - blockDepth) / 2}px`,
                    borderColor: isSelected
                      ? 'rgba(56, 189, 248, 0.5)'
                      : 'rgba(255, 255, 255, 0.1)',
                    backgroundColor: isAssembled
                      ? isSelected
                        ? 'rgba(14, 165, 233, 0.25)'
                        : 'rgba(15, 22, 38, 0.85)'
                      : 'rgba(15, 22, 38, 0.2)',
                  }}
                  className={`absolute rounded-lg border backdrop-blur-md flex items-center justify-center`}
                >
                  {/* Subtle technical cross-wire */}
                  <div className="w-8 h-8 rounded border border-white/[0.06] border-dashed opacity-40" />
                </div>

                {/* BOTTOM FACE */}
                <div
                  style={{
                    width: `${blockWidth}px`,
                    height: `${blockDepth}px`,
                    transform: `rotateX(-90deg) translateZ(${blockDepth / 2}px)`,
                    top: `${(blockHeight - blockDepth) / 2}px`,
                    borderColor: 'rgba(255, 255, 255, 0.06)',
                    backgroundColor: 'rgba(6, 9, 16, 0.6)',
                  }}
                  className="absolute rounded-lg border backdrop-blur-md"
                />

                {/* RIGHT FACE */}
                <div
                  style={{
                    width: `${blockDepth}px`,
                    height: `${blockHeight}px`,
                    transform: `rotateY(90deg) translateZ(${blockWidth / 2}px)`,
                    left: `${(blockWidth - blockDepth) / 2}px`,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(10, 15, 26, 0.8)',
                  }}
                  className="absolute rounded-lg border backdrop-blur-md"
                />

                {/* LEFT FACE */}
                <div
                  style={{
                    width: `${blockDepth}px`,
                    height: `${blockHeight}px`,
                    transform: `rotateY(-90deg) translateZ(${blockWidth / 2}px)`,
                    left: `${(blockWidth - blockDepth) / 2}px`,
                    borderColor: 'rgba(255, 255, 255, 0.08)',
                    backgroundColor: 'rgba(10, 15, 26, 0.8)',
                  }}
                  className="absolute rounded-lg border backdrop-blur-md"
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Discrete Drag Rotate Hint */}
      <div className="absolute bottom-2 left-3 text-[10px] font-mono text-slate-500 bg-black/40 backdrop-blur-md px-2.5 py-0.5 rounded-md border border-white/[0.06] flex items-center gap-1.5 pointer-events-none">
        <Layers className="w-3 h-3 text-sky-400" />
        <span>{INSTALL_MODAL_STRINGS.dragHintClean}</span>
      </div>

      {/* Assembled Counter Badge */}
      <div className="absolute top-3 right-3 text-[10px] font-mono font-medium text-slate-300 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-md border border-white/[0.08]">
        {INSTALL_MODAL_STRINGS.blocksAssembledCount(Math.min(5, step), 5)}
      </div>
    </div>
  );
};
