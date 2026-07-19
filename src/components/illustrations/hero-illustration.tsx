"use client";

import { motion } from "framer-motion";

export function HeroAutomationSvg({ className = "w-full max-w-lg h-auto" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 600 480"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="primaryGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FA4616" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#FFB40E" stopOpacity="0.8" />
        </linearGradient>

        <linearGradient id="blueGlow" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0067DF" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#34DE69" stopOpacity="0.8" />
        </linearGradient>

        <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
          <feDropShadow dx="0" dy="8" stdDeviation="12" floodColor="#0067DF" floodOpacity="0.15" />
        </filter>
      </defs>

      {/* Outer Glow Orbs */}
      <circle cx="300" cy="240" r="180" fill="url(#primaryGlow)" opacity="0.08" />
      <circle cx="420" cy="180" r="140" fill="url(#blueGlow)" opacity="0.08" />

      {/* Node Connection Lines */}
      <motion.path
        d="M120 280 L240 160 L360 280 L480 160"
        stroke="#0067DF"
        strokeWidth="3"
        strokeDasharray="6 6"
        opacity="0.4"
        animate={{ strokeDashoffset: [0, -24] }}
        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
      />

      <motion.path
        d="M160 160 L300 320 L440 200"
        stroke="#FA4616"
        strokeWidth="3"
        strokeDasharray="8 8"
        opacity="0.4"
        animate={{ strokeDashoffset: [0, 32] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />

      {/* Main Center Platform / Card */}
      <g filter="url(#shadow)">
        <rect x="180" y="140" width="240" height="200" rx="24" fill="#FFFFFF" stroke="#0067DF" strokeWidth="2" strokeOpacity="0.2" />
        
        {/* Header Bar */}
        <rect x="200" y="160" width="200" height="40" rx="12" fill="#F1F6F8" />
        <circle cx="224" cy="180" r="8" fill="#FA4616" />
        <rect x="240" y="174" width="80" height="12" rx="6" fill="#0067DF" />
        <rect x="330" y="174" width="50" height="12" rx="6" fill="#34DE69" />

        {/* Code / Workflow blocks inside card */}
        <rect x="200" y="215" width="90" height="45" rx="10" fill="#0067DF" fillOpacity="0.1" stroke="#0067DF" strokeWidth="1.5" />
        <text x="212" y="242" fill="#0067DF" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Studio RPA</text>

        <rect x="310" y="215" width="90" height="45" rx="10" fill="#FA4616" fillOpacity="0.1" stroke="#FA4616" strokeWidth="1.5" />
        <text x="325" y="242" fill="#FA4616" fontSize="12" fontWeight="bold" fontFamily="sans-serif">Agentic AI</text>

        {/* Bottom Status Pill */}
        <rect x="230" y="275" width="140" height="32" rx="16" fill="#FA4616" />
        <text x="250" y="295" fill="#FFFFFF" fontSize="11" fontWeight="bold" fontFamily="sans-serif">⚡ 100+ Bots Active</text>
      </g>

      {/* Floating Node 1: UiPath Robot Badge */}
      <motion.g
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <rect x="80" y="120" width="110" height="70" rx="16" fill="#FFFFFF" stroke="#FA4616" strokeWidth="2" />
        <circle cx="110" cy="155" r="16" fill="#FA4616" />
        <text x="105" y="160" fill="#FFFFFF" fontSize="14" fontWeight="bold">Ui</text>
        <text x="135" y="148" fill="#000000" fontSize="11" fontWeight="bold">UiPath</text>
        <text x="135" y="162" fill="#58595B" fontSize="9">Certified</text>
      </motion.g>

      {/* Floating Node 2: Gold Coin Badge */}
      <motion.g
        animate={{ y: [0, 14, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      >
        <rect x="410" y="260" width="120" height="70" rx="16" fill="#FFFFFF" stroke="#FFB40E" strokeWidth="2" />
        <circle cx="440" cy="295" r="16" fill="#FFB40E" />
        <text x="435" y="300" fill="#FFFFFF" fontSize="14" fontWeight="bold">🪙</text>
        <text x="465" y="288" fill="#000000" fontSize="11" fontWeight="bold">Coins</text>
        <text x="465" y="302" fill="#34DE69" fontSize="10" fontWeight="bold">+1,000 XP</text>
      </motion.g>

      {/* Floating Node 3: PSNA Tamil Community Crest */}
      <motion.g
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
      >
        <rect x="380" y="80" width="140" height="65" rx="16" fill="#FFFFFF" stroke="#0067DF" strokeWidth="2" />
        <rect x="395" y="95" width="35" height="35" rx="10" fill="#0067DF" />
        <text x="403" y="117" fill="#FFFFFF" fontSize="14">🎓</text>
        <text x="438" y="110" fill="#000000" fontSize="11" fontWeight="bold">PSNA CET</text>
        <text x="438" y="124" fill="#58595B" fontSize="9">Tamil Community</text>
      </motion.g>
    </svg>
  );
}
