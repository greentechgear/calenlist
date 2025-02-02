import React, { useState, useEffect } from 'react';
import { getRandomGradient } from '../../utils/gradients';

export default function AnimatedBackground() {
  const [gradient, setGradient] = useState(getRandomGradient());

  useEffect(() => {
    // Set initial random gradient
    setGradient(getRandomGradient());
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradient.from} ${gradient.to} transition-colors duration-1000`} />
      
      {/* Animated gradient orbs */}
      <div className="absolute inset-0">
        <div className={`absolute w-[500px] h-[500px] ${gradient.orbs[0]} rounded-full opacity-30 blur-3xl animate-float-slow top-[-20%] left-[-10%] transition-colors duration-1000`} />
        <div className={`absolute w-[400px] h-[400px] ${gradient.orbs[1]} rounded-full opacity-30 blur-3xl animate-float-medium top-[60%] right-[-5%] transition-colors duration-1000`} />
        <div className={`absolute w-[300px] h-[300px] ${gradient.orbs[2]} rounded-full opacity-30 blur-3xl animate-float-fast top-[30%] left-[60%] transition-colors duration-1000`} />
      </div>
    </div>
  );
}