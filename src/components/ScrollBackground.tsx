import React, { useEffect, useRef, useState, useCallback } from 'react';

interface ScrollBackgroundProps {
  frameCount?: number;
  folderPath?: string;
  className?: string;
}

export const ScrollBackground: React.FC<ScrollBackgroundProps> = ({
  frameCount = 180,
  folderPath = '/animation',
  className = '',
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imagesRef = useRef<Map<number, HTMLImageElement>>(new Map());
  const [imagesAvailable, setImagesAvailable] = useState<boolean | null>(null);

  // Animação suavizada com lerp
  const currentProgressRef = useRef(0);
  const targetProgressRef = useRef(0);
  const animationFrameId = useRef<number | null>(null);
  const isRunningRef = useRef(true);

  // Helper para obter URL do frame
  const getFrameUrl = useCallback((index: number) => {
    const padded = String(index).padStart(3, '0');
    return `${folderPath}/frame-${padded}.jpg`;
  }, [folderPath]);

  // Checar se as imagens estão disponíveis carregando o primeiro frame
  useEffect(() => {
    let active = true;
    const testImg = new Image();
    testImg.src = getFrameUrl(1);

    testImg.onload = () => {
      if (!active) return;
      setImagesAvailable(true);
      imagesRef.current.set(1, testImg);

      // Pré-carregamento inteligente dos frames
      // Prioridade 1: Primeiros 20 frames
      for (let i = 2; i <= Math.min(25, frameCount); i++) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          imagesRef.current.set(i, img);
        };
      }

      // Prioridade 2: Quadros-chave (a cada 5) para rolagem rápida
      for (let i = 26; i <= frameCount; i += 5) {
        const img = new Image();
        img.src = getFrameUrl(i);
        img.onload = () => {
          imagesRef.current.set(i, img);
        };
      }

      // Prioridade 3: Restante dos frames em background idle
      const loadRemaining = () => {
        for (let i = 2; i <= frameCount; i++) {
          if (!imagesRef.current.has(i)) {
            const img = new Image();
            img.src = getFrameUrl(i);
            img.onload = () => {
              imagesRef.current.set(i, img);
            };
          }
        }
      };

      if ('requestIdleCallback' in window) {
        (window as any).requestIdleCallback(loadRemaining, { timeout: 2500 });
      } else {
        setTimeout(loadRemaining, 1200);
      }
    };

    testImg.onerror = () => {
      if (!active) return;
      setImagesAvailable(false);
    };

    return () => {
      active = false;
    };
  }, [frameCount, getFrameUrl]);

  // Listener de rolagem para calcular progresso no documento inteiro
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY || window.pageYOffset;
      const maxScroll = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight
      );
      targetProgressRef.current = Math.min(1, Math.max(0, scrollY / maxScroll));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Redimensionamento do canvas com Retina / HiDPI
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const handleResize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Loop principal de renderização no Canvas
  useEffect(() => {
    isRunningRef.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Partículas procedurais para o fallback elegante
    const particles = Array.from({ length: 45 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 2 + 1,
      speedY: Math.random() * 0.4 + 0.1,
      opacity: Math.random() * 0.4 + 0.2,
      pulse: Math.random() * Math.PI,
    }));

    let lastTime = performance.now();

    const render = (time: number) => {
      if (!isRunningRef.current) return;

      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Suavização da rolagem (lerp suave)
      const diff = targetProgressRef.current - currentProgressRef.current;
      currentProgressRef.current += diff * 0.12;

      const progress = currentProgressRef.current;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      if (imagesAvailable) {
        // Cálculo do frame atual (1 a frameCount)
        const frameIdx = Math.min(
          frameCount,
          Math.max(1, Math.round(progress * (frameCount - 1)) + 1)
        );

        // Busca o frame no cache ou o mais próximo disponível
        let img = imagesRef.current.get(frameIdx);
        if (!img) {
          // Busca o mais próximo carregado para não piscar
          let closest = 1;
          let minDiff = Infinity;
          imagesRef.current.forEach((cachedImg, idx) => {
            const d = Math.abs(idx - frameIdx);
            if (d < minDiff) {
              minDiff = d;
              closest = idx;
              img = cachedImg;
            }
          });
        }

        if (img && img.complete && img.naturalWidth > 0) {
          // Cover fitting no canvas
          const hRatio = width / img.naturalWidth;
          const vRatio = height / img.naturalHeight;
          const ratio = Math.max(hRatio, vRatio);
          const centerShiftX = (width - img.naturalWidth * ratio) / 2;
          const centerShiftY = (height - img.naturalHeight * ratio) / 2;

          ctx.drawImage(
            img,
            0,
            0,
            img.naturalWidth,
            img.naturalHeight,
            centerShiftX,
            centerShiftY,
            img.naturalWidth * ratio,
            img.naturalHeight * ratio
          );
        }
      } else {
        // Fallback procedural: malha de gradientes fluida e partículas cósmicas
        // reativas à rolagem
        const gradient = ctx.createRadialGradient(
          width * 0.5 + Math.sin(progress * Math.PI * 2) * (width * 0.2),
          height * 0.4 + Math.cos(progress * Math.PI * 2) * (height * 0.15),
          50,
          width * 0.5,
          height * 0.5,
          Math.max(width, height) * 0.8
        );
        gradient.addColorStop(0, 'rgba(125, 249, 194, 0.08)');
        gradient.addColorStop(0.5, 'rgba(91, 229, 255, 0.03)');
        gradient.addColorStop(1, 'rgba(5, 5, 8, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);

        // Partículas reativas à rolagem
        particles.forEach((p) => {
          p.y -= (p.speedY + progress * 1.5) * dt * 60;
          if (p.y < 0) p.y = height;
          p.pulse += dt * 2;

          const currentOpacity = p.opacity + Math.sin(p.pulse) * 0.15;
          ctx.fillStyle = `rgba(125, 249, 194, ${Math.max(0.05, currentOpacity)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        });
      }

      animationFrameId.current = requestAnimationFrame(render);
    };

    animationFrameId.current = requestAnimationFrame(render);

    return () => {
      isRunningRef.current = false;
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [imagesAvailable, frameCount]);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      {/* Canvas com a sequência de frames do Scroll */}
      <canvas
        ref={canvasRef}
        className="w-full h-full object-cover"
        style={{
          width: '100%',
          height: '100%',
          opacity: 0.88,
        }}
      />

      {/* Véu sutil escuro para contraste e legibilidade impecável dos textos */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050508]/65 via-[#050508]/40 to-[#050508]/85" />
    </div>
  );
};

export default ScrollBackground;
