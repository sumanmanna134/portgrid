import React from 'react';

/**
 * High-tech isometric 3D cluster enclave illustration.
 * Renders the deterministic enclave platform, central floating 3D cube with neon emblems,
 * auxiliary satellite cubes, floating gear, telemetry chips, and neon circuit traces.
 * Conforms strictly to zero emojis, zero em-dashes, zero unicode arrows.
 */
export const IsometricClusterIllustration: React.FC<{ className?: string }> = ({
  className = '',
}) => {
  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Background ambient neon bloom */}
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none -translate-y-4 translate-x-6" />
      <div className="absolute w-60 h-60 rounded-full bg-blue-600/10 blur-2xl pointer-events-none translate-y-8 -translate-x-10" />

      <svg
        viewBox="0 0 540 360"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto drop-shadow-2xl overflow-visible"
      >
        <defs>
          {/* Neon Glow Filters */}
          <filter id="neonGlowCyan" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="4" result="blur1" />
            <feGaussianBlur stdDeviation="8" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <filter id="neonGlowGreen" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="3" result="blur1" />
            <feGaussianBlur stdDeviation="6" result="blur2" />
            <feMerge>
              <feMergeNode in="blur2" />
              <feMergeNode in="blur1" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Gradients */}
          <linearGradient id="cubeTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#475569" />
            <stop offset="50%" stopColor="#334155" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>

          <linearGradient id="cubeLeftGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#090e17" />
          </linearGradient>

          <linearGradient id="cubeRightGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#162234" />
            <stop offset="100%" stopColor="#0b1320" />
          </linearGradient>

          <linearGradient id="platformTopGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#132742" />
            <stop offset="70%" stopColor="#0c182b" />
            <stop offset="100%" stopColor="#07101e" />
          </linearGradient>

          <linearGradient id="platformSideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0c1a2e" />
            <stop offset="100%" stopColor="#030812" />
          </linearGradient>

          <linearGradient id="platformGlowLine" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#00e5ff" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.3" />
          </linearGradient>

          <linearGradient id="pedestalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#1e3a5f" />
            <stop offset="100%" stopColor="#0f2238" />
          </linearGradient>

          <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#4f46e5" />
            <stop offset="100%" stopColor="#3730a3" />
          </linearGradient>
        </defs>

        {/* 1. GROUND ISOMETRIC CIRCUIT TRACES */}
        <g strokeLinecap="round" strokeLinejoin="round" opacity="0.85">
          {/* Subtle floor grid traces */}
          <path
            d="M 120,220 L 220,170 M 180,270 L 320,190 M 240,320 L 440,210 M 340,340 L 480,260"
            stroke="#1e293b"
            strokeWidth="1"
            strokeDasharray="4 4"
            opacity="0.4"
          />

          {/* Active Cyan Neon Traces */}
          <path
            d="M 230,195 L 265,175 L 265,140 L 245,130"
            stroke="#00e5ff"
            strokeWidth="1.5"
            filter="url(#neonGlowCyan)"
            opacity="0.8"
          />
          <path
            d="M 210,230 L 250,250 L 300,225"
            stroke="#00e5ff"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <path
            d="M 340,270 L 340,305 L 290,330"
            stroke="#10b981"
            strokeWidth="1.5"
            filter="url(#neonGlowGreen)"
            opacity="0.75"
          />
          <path
            d="M 390,260 L 430,280 L 430,310"
            stroke="#10b981"
            strokeWidth="1.5"
            opacity="0.7"
          />
          <path
            d="M 405,215 L 445,195 L 445,175"
            stroke="#00e5ff"
            strokeWidth="1.5"
            filter="url(#neonGlowCyan)"
            opacity="0.85"
          />
          <path
            d="M 410,140 L 450,120 L 480,135"
            stroke="#0284c7"
            strokeWidth="1.5"
            opacity="0.6"
          />
          <path
            d="M 370,110 L 400,95 L 400,75"
            stroke="#00e5ff"
            strokeWidth="1.5"
            opacity="0.75"
          />

          {/* Circuit connection nodes / solder pads */}
          <circle cx="245" cy="130" r="3" fill="#00e5ff" filter="url(#neonGlowCyan)" />
          <circle cx="210" cy="230" r="2.5" fill="#6366f1" />
          <circle cx="290" cy="330" r="3" fill="#10b981" filter="url(#neonGlowGreen)" />
          <circle cx="430" cy="310" r="2.5" fill="#10b981" />
          <circle cx="445" cy="175" r="3" fill="#00e5ff" filter="url(#neonGlowCyan)" />
          <circle cx="400" cy="75" r="3" fill="#00e5ff" filter="url(#neonGlowCyan)" />
        </g>

        {/* 2. ISOMETRIC BASE TABLET / ENCLAVE PLATFORM */}
        <g>
          {/* Base Platform Shadow */}
          <path
            d="M 230,225 L 345,160 L 460,225 L 345,290 Z"
            fill="#030712"
            opacity="0.7"
            transform="translate(0, 20)"
          />

          {/* Base Platform Extrusion Sides (Bottom Thickness) */}
          <path
            d="M 225,215 L 345,283 L 345,302 L 225,234 Z"
            fill="url(#platformSideGrad)"
          />
          <path
            d="M 345,283 L 465,215 L 465,234 L 345,302 Z"
            fill="#050c17"
          />
          <path
            d="M 225,234 L 345,302 L 465,234"
            stroke="#00e5ff"
            strokeWidth="1"
            opacity="0.4"
            fill="none"
          />

          {/* Base Platform Top Surface */}
          <path
            d="M 225,215 L 345,148 L 465,215 L 345,283 Z"
            fill="url(#platformTopGrad)"
            stroke="url(#platformGlowLine)"
            strokeWidth="1.75"
          />

          {/* Base Platform Inner Glow Inset */}
          <path
            d="M 245,215 L 345,159 L 445,215 L 345,271 Z"
            fill="none"
            stroke="#00e5ff"
            strokeWidth="1"
            opacity="0.3"
          />

          {/* Inner Raised Pedestal */}
          <path
            d="M 275,200 L 345,161 L 415,200 L 345,239 Z"
            fill="url(#pedestalGrad)"
            stroke="#38bdf8"
            strokeWidth="1.2"
            opacity="0.9"
          />
          {/* Pedestal front beveled thickness */}
          <path
            d="M 275,200 L 345,239 L 345,246 L 275,207 Z"
            fill="#0a192f"
          />
          <path
            d="M 345,239 L 415,200 L 415,207 L 345,246 Z"
            fill="#061224"
          />
          <path
            d="M 275,207 L 345,246 L 415,207"
            stroke="#00e5ff"
            strokeWidth="1"
            opacity="0.6"
            fill="none"
          />
        </g>

        {/* 3. SURROUNDING SATELLITE OBJECTS */}

        {/* Satellite 1: Metallic Indigo 3D Gear (Left) */}
        <g transform="translate(198, 205)">
          <path
            d="M 12,-18 L 18,-14 L 16,-8 L 24,-2 L 28,-7 L 34,-3 L 30,5 L 35,13 L 41,10 L 44,17 L 38,22 L 36,30 L 42,34 L 38,41 L 30,39 L 23,45 L 24,52 L 17,54 L 14,47 L 6,45 L 1,51 L -5,48 L -2,41 L -8,34 L -15,35 L -17,28 L -11,25 L -12,17 L -18,14 L -16,7 L -9,8 L -5,1 L -8,-6 L -3,-10 L 4,-6 L 10,-13 Z"
            fill="url(#gearGrad)"
            stroke="#818cf8"
            strokeWidth="1"
            transform="scale(0.55) skewX(-20) rotate(15)"
            opacity="0.95"
          />
          {/* Gear center hole */}
          <ellipse cx="6" cy="10" rx="3.5" ry="2" fill="#0a0f1d" stroke="#c7d2fe" strokeWidth="0.8" />
        </g>

        {/* Satellite 2: Auxiliary Satellite Cube (Upper-Right) */}
        <g transform="translate(435, 145)">
          {/* Small pedestal */}
          <path d="M -15,20 L 0,12 L 15,20 L 0,28 Z" fill="#0b172a" stroke="#0284c7" strokeWidth="0.8" />
          {/* Mini 3D cube */}
          <path d="M 0,-8 L 14,0 L 0,8 L -14,0 Z" fill="#38bdf8" opacity="0.9" />
          <path d="M -14,0 L 0,8 L 0,20 L -14,12 Z" fill="#0369a1" />
          <path d="M 0,8 L 14,0 L 14,12 L 0,20 Z" fill="#0c4a6e" />
          <path d="M 0,-8 L 14,0 L 0,8 L -14,0 Z" stroke="#e0f2fe" strokeWidth="0.7" fill="none" />
        </g>

        {/* Satellite 3: Lower-Right Mini Enclave Base */}
        <g transform="translate(425, 235)">
          <path d="M -16,10 L 0,1 L 16,10 L 0,19 Z" fill="#0f172a" stroke="#00e5ff" strokeWidth="0.8" opacity="0.8" />
          <ellipse cx="0" cy="10" rx="4" ry="2.5" fill="#00e5ff" filter="url(#neonGlowCyan)" />
        </g>

        {/* Satellite 4: Glass Code Window / Terminal Chip (Upper-Left) */}
        <g transform="translate(230, 85)">
          <rect
            x="0"
            y="0"
            width="42"
            height="56"
            rx="5"
            fill="#09121f"
            fillOpacity="0.85"
            stroke="#00e5ff"
            strokeWidth="1"
            filter="url(#neonGlowCyan)"
          />
          {/* Terminal header */}
          <circle cx="7" cy="8" r="2" fill="#10b981" />
          <circle cx="14" cy="8" r="1.5" fill="#38bdf8" />
          <line x1="5" y1="15" x2="37" y2="15" stroke="#1e293b" strokeWidth="1" />
          {/* Code row lines */}
          <line x1="7" y1="22" x2="28" y2="22" stroke="#00e5ff" strokeWidth="2" strokeLinecap="round" />
          <line x1="7" y1="30" x2="35" y2="30" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
          <line x1="7" y1="37" x2="22" y2="37" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="7" y1="44" x2="31" y2="44" stroke="#64748b" strokeWidth="1.2" strokeLinecap="round" />
        </g>

        {/* Satellite 5: Node Network / Identity Avatar Chip (Upper-Right) */}
        <g transform="translate(390, 48)">
          <rect
            x="0"
            y="0"
            width="44"
            height="44"
            rx="6"
            fill="#0b1526"
            fillOpacity="0.9"
            stroke="#00e5ff"
            strokeWidth="1"
            filter="url(#neonGlowCyan)"
          />
          {/* Node mesh / avatar icon */}
          <circle cx="22" cy="16" r="5" fill="#00e5ff" opacity="0.9" />
          <path
            d="M 12,32 C 12,25 16,23 22,23 C 28,23 32,25 32,32"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
            fill="none"
          />
          <circle cx="34" cy="12" r="2.5" fill="#10b981" filter="url(#neonGlowGreen)" />
        </g>

        {/* Satellite 6: Green Data Capsule / Pill (Lower-Left) */}
        <g transform="translate(265, 275) rotate(-15)">
          <rect
            x="0"
            y="0"
            width="34"
            height="18"
            rx="9"
            fill="#062e20"
            fillOpacity="0.9"
            stroke="#10b981"
            strokeWidth="1.2"
            filter="url(#neonGlowGreen)"
          />
          {/* 3 Green data bars */}
          <line x1="8" y1="9" x2="14" y2="9" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          <line x1="17" y1="9" x2="21" y2="9" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
          <line x1="24" y1="9" x2="27" y2="9" stroke="#34d399" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Satellite 7: Security Arc / Bracket Badge (Lower-Right) */}
        <g transform="translate(415, 275) rotate(15)">
          <rect
            x="0"
            y="0"
            width="36"
            height="26"
            rx="5"
            fill="#0b172a"
            fillOpacity="0.9"
            stroke="#10b981"
            strokeWidth="1.2"
          />
          <path
            d="M 12,9 L 24,9 C 24,18 18,21 18,21 C 18,21 12,18 12,9 Z"
            fill="#10b981"
            fillOpacity="0.2"
            stroke="#10b981"
            strokeWidth="1.5"
            strokeLinejoin="round"
            filter="url(#neonGlowGreen)"
          />
        </g>

        {/* 4. CENTRAL FLOATING 3D ENCLAVE CUBE */}
        {/* Uses float animation for lifelike levitation */}
        <g className="animate-float-3d" style={{ transformOrigin: '345px 145px' }}>
          {/* Cube Ambient Drop Shadow onto Pedestal */}
          <ellipse
            cx="345"
            cy="195"
            rx="38"
            ry="18"
            fill="#000000"
            opacity="0.65"
          />

          {/* Top Face (Isometric Diamond) */}
          <path
            d="M 345,62 L 405,96 L 345,130 L 285,96 Z"
            fill="url(#cubeTopGrad)"
            stroke="#64748b"
            strokeWidth="1"
          />
          {/* Top Face perimeter highlight */}
          <path
            d="M 285,96 L 345,62 L 405,96"
            stroke="#94a3b8"
            strokeWidth="1.2"
            fill="none"
          />

          {/* Left Face (Vertical Parallelogram) */}
          <path
            d="M 285,96 L 345,130 L 345,202 L 285,168 Z"
            fill="url(#cubeLeftGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* Left Face Emblem: Glowing Cyan Wave / Enclave Database Chevrons */}
          <g transform="translate(300, 134) skewY(26)">
            <path
              d="M 0,0 C 7,-4 14,4 22,0"
              stroke="#00e5ff"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonGlowCyan)"
            />
            <path
              d="M 0,8 C 7,4 14,12 22,8"
              stroke="#00e5ff"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              filter="url(#neonGlowCyan)"
            />
            <path
              d="M 0,16 C 7,12 14,20 22,16"
              stroke="#38bdf8"
              strokeWidth="2.5"
              strokeLinecap="round"
              fill="none"
              opacity="0.8"
            />
          </g>

          {/* Right Face (Vertical Parallelogram) */}
          <path
            d="M 345,130 L 405,96 L 405,168 L 345,202 Z"
            fill="url(#cubeRightGrad)"
            stroke="#1e293b"
            strokeWidth="0.8"
          />
          {/* Right Face Emblem: Glowing Neon Green Hexagon Node / Container Bracket */}
          <g transform="translate(362, 134) skewY(-26)">
            {/* Hexagon symbol */}
            <path
              d="M 12,-10 L 22,-4 L 22,8 L 12,14 L 2,8 L 2,-4 Z"
              fill="#062e20"
              fillOpacity="0.8"
              stroke="#10b981"
              strokeWidth="2.5"
              strokeLinejoin="round"
              filter="url(#neonGlowGreen)"
            />
            {/* Central node spark */}
            <circle cx="12" cy="2" r="2.5" fill="#34d399" filter="url(#neonGlowGreen)" />
          </g>

          {/* Corner Ridge Highlighting */}
          <line
            x1="345"
            y1="130"
            x2="345"
            y2="202"
            stroke="#38bdf8"
            strokeWidth="1.2"
            opacity="0.8"
          />
        </g>
      </svg>
    </div>
  );
};
