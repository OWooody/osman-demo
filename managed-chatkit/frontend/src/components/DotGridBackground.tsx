import { useEffect, useRef } from 'react';

export function DotGridBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dot parameters
    const spacing = 18;
    const dotRadius = 1.5;
    const diagonalSpacing = 4;
    
    // Pre-generate random phase offsets for each dot
    const randomPhases: number[][] = [];
    const randomSpeeds: number[][] = [];
    const maxCols = 100;
    const maxRows = 80;
    
    for (let row = 0; row < maxRows; row++) {
      randomPhases[row] = [];
      randomSpeeds[row] = [];
      for (let col = 0; col < maxCols; col++) {
        randomPhases[row][col] = Math.random() * Math.PI * 2;
        randomSpeeds[row][col] = 1.5 + Math.random() * 2;
      }
    }

    let animationId: number;
    let lastWidth = 0;
    let lastHeight = 0;
    const startTime = performance.now();

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      
      // Resize canvas if needed
      if (rect.width !== lastWidth || rect.height !== lastHeight) {
        lastWidth = rect.width;
        lastHeight = rect.height;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
      }
      
      // Reset transform and scale for DPR
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      
      // Clear
      ctx.clearRect(0, 0, rect.width, rect.height);
      
      // Draw dots
      const cols = Math.ceil(rect.width / spacing) + 1;
      const rows = Math.ceil(rect.height / spacing) + 1;
      
      const elapsed = (performance.now() - startTime) / 1000;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = col * spacing;
          const y = row * spacing;
          
          // Check if on diagonal stripe
          const isOnStripe = (row + col) % diagonalSpacing === 0;
          
          // Random twinkling animation
          const phase = randomPhases[row % maxRows]?.[col % maxCols] || 0;
          const speed = randomSpeeds[row % maxRows]?.[col % maxCols] || 2;
          
          // Smooth oscillation between 0 and 1
          const twinkle = (Math.sin(elapsed * speed + phase) + 1) / 2;
          
          // Opacity range based on stripe
          const minOpacity = isOnStripe ? 0.08 : 0.02;
          const maxOpacity = isOnStripe ? 0.45 : 0.12;
          const opacity = minOpacity + twinkle * (maxOpacity - minOpacity);
          
          ctx.beginPath();
          ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(100, 100, 100, ${opacity})`;
          ctx.fill();
        }
      }
      
      // Continue animation loop
      animationId = requestAnimationFrame(draw);
    };

    // Start animation
    animationId = requestAnimationFrame(draw);
    
    // Cleanup
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="absolute inset-0 bg-[#f9f9f9]">
      <canvas
        ref={canvasRef}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}
