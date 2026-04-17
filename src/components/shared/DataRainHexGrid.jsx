import { useEffect, useRef } from 'react';

export function DataRainHexGrid() {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // Set canvas size with device pixel ratio
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.scale(dpr, dpr);
    };

    resize();

    // ResizeObserver for efficient resize handling
    const resizeObserver = new ResizeObserver(() => {
      resize();
    });
    resizeObserver.observe(document.body);

    // Data rain setup
    const columnWidth = 20;
    const columns = Math.ceil(window.innerWidth / columnWidth);

    // Only have 15-20% of columns active at any given time
    const activeColumnCount = Math.ceil(columns * 0.18);
    const activeColumns = new Set();
    const initializeActiveColumns = () => {
      activeColumns.clear();
      while (activeColumns.size < activeColumnCount) {
        activeColumns.add(Math.floor(Math.random() * columns));
      }
    };
    initializeActiveColumns();

    // Periodically change which columns are active
    const intervalId = setInterval(initializeActiveColumns, 5000);

    const drops = Array(columns).fill(0).map((_, i) => ({
      y: Math.random() * window.innerHeight,
      speed: 1.5 + Math.random() * 2,
      active: false
    }));

    // Katakana characters + some 0/1
    const katakana = '\u30A0\u30A1\u30A2\u30A3\u30A4\u30A5\u30A6\u30A7\u30A8\u30A9\u30AA\u30AB\u30AC\u30AD\u30AE\u30AF\u30B0\u30B1\u30B2\u30B3\u30B4\u30B5\u30B6\u30B7\u30B8\u30B9\u30BA\u30BB\u30BC\u30BD\u30BE\u30BF\u30C0\u30C1\u30C2\u30C3\u30C4\u30C5\u30C6\u30C7\u30C8\u30C9\u30CA\u30CB\u30CC\u30CD\u30CE\u30CF\u30D0\u30D1\u30D2\u30D3\u30D4\u30D5\u30D6\u30D7\u30D8\u30D9\u30DA\u30DB\u30DC\u30DD\u30DE\u30DF\u30E0\u30E1\u30E2\u30E3\u30E4\u30E5\u30E6\u30E7\u30E8\u30E9\u30EA\u30EB\u30EC\u30ED\u30FE\u30FF01';
    const chars = katakana + '01';

    // Animation loop
    const animate = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;

      // Fill with semi-transparent background for trails (higher alpha = shorter trails)
      ctx.fillStyle = 'rgba(26, 31, 46, 0.6)';
      ctx.fillRect(0, 0, width, height);

      // Draw data rain (only for active columns)
      ctx.fillStyle = 'rgba(0, 255, 200, 0.1)';
      ctx.font = '12px monospace';

      for (let i = 0; i < drops.length; i++) {
        // Only draw if this column is active
        if (activeColumns.has(i)) {
          const char = chars[Math.floor(Math.random() * chars.length)];
          const x = i * columnWidth;
          const y = drops[i].y;

          ctx.fillText(char, x, y);
        }

        // Move drop down
        drops[i].y += drops[i].speed;

        // Reset if off screen
        if (drops[i].y > height && Math.random() > 0.975) {
          drops[i].y = 0;
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    // Cleanup
    return () => {
      resizeObserver.disconnect();
      clearInterval(intervalId);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: -1,
        pointerEvents: 'none'
      }}
    />
  );
}
