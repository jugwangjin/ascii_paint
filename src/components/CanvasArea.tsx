import React, { useRef, useState, useEffect } from 'react';
import { AppState, Point } from '../types';
import { floodFill, renderAscii } from '../lib/paint';

interface CanvasAreaProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  canvasSize: { width: number, height: number };
}

export function CanvasArea({ appState, setAppState, canvasSize }: CanvasAreaProps) {
  const internalCanvasRef = useRef<HTMLCanvasElement>(null);
  const displayCanvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<Point | null>(null);
  const [snapshot, setSnapshot] = useState<ImageData | null>(null);

  useEffect(() => {
    // initialize inner canvas with black background
    if (internalCanvasRef.current && displayCanvasRef.current) {
      const ctx = internalCanvasRef.current.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
      }
      updateDisplay();
    }
  }, [canvasSize]);

  // Re-render display when font size or curvature toggle changes
  useEffect(() => {
    updateDisplay();
  }, [appState.fontSize, appState.useCurvature]);

  const updateDisplay = () => {
    if (!internalCanvasRef.current || !displayCanvasRef.current) return;
    const iCtx = internalCanvasRef.current.getContext('2d');
    const dCtx = displayCanvasRef.current.getContext('2d');
    if (iCtx && dCtx) {
      renderAscii(iCtx, dCtx, appState.fontSize, appState.useCurvature);
    }
  };

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement>): Point => {
    if (!displayCanvasRef.current) return { x: 0, y: 0 };
    const rect = displayCanvasRef.current.getBoundingClientRect();
    const scaleX = displayCanvasRef.current.width / rect.width;
    const scaleY = displayCanvasRef.current.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button !== 0 && e.button !== 2) return; // Support left and right click
    const isRightClick = e.button === 2;
    const color = isRightClick ? appState.secondaryColor : appState.primaryColor;
    
    const pt = getCoordinates(e);
    const canvas = internalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (appState.currentTool === 'fill') {
      floodFill(ctx, Math.floor(pt.x), Math.floor(pt.y), color);
      updateDisplay();
      return;
    }

    setIsDrawing(true);
    setStartPoint(pt);
    
    // Save snapshot for tools that need it
    if (['line', 'rect', 'circle'].includes(appState.currentTool)) {
      setSnapshot(ctx.getImageData(0, 0, canvas.width, canvas.height));
    }

    ctx.beginPath();
    ctx.moveTo(pt.x, pt.y);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    if (appState.currentTool === 'eraser') {
      ctx.lineWidth = appState.fontSize * 2;
      ctx.strokeStyle = '#000000'; // Black background eraser
    } else {
      ctx.lineWidth = appState.fontSize; // Brush thickness scales with font
      ctx.strokeStyle = color;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !startPoint) return;
    const canvas = internalCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const pt = getCoordinates(e);

    if (appState.currentTool === 'pencil' || appState.currentTool === 'eraser') {
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
    } else if (snapshot) {
      // restore snapshot
      ctx.putImageData(snapshot, 0, 0);
      const isRightClick = e.buttons === 2;
      const color = isRightClick ? appState.secondaryColor : appState.primaryColor;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = appState.fontSize;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      
      ctx.beginPath();
      if (appState.currentTool === 'line') {
        ctx.moveTo(startPoint.x, startPoint.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      } else if (appState.currentTool === 'rect') {
        ctx.rect(startPoint.x, startPoint.y, pt.x - startPoint.x, pt.y - startPoint.y);
        ctx.stroke();
      } else if (appState.currentTool === 'circle') {
        const radius = Math.sqrt(Math.pow(pt.x - startPoint.x, 2) + Math.pow(pt.y - startPoint.y, 2));
        ctx.arc(startPoint.x, startPoint.y, radius, 0, 2 * Math.PI);
        ctx.stroke();
      }
    }
    
    // Don't render ASCII on every single mousemove pixel for performance, but it's usually fast enough for JS.
    // If it lags, we can debounce or use a requestAnimationFrame.
    requestAnimationFrame(updateDisplay);
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    const canvas = internalCanvasRef.current;
    if (canvas) {
      canvas.getContext('2d')?.closePath();
    }
    setIsDrawing(false);
    setStartPoint(null);
    setSnapshot(null);
    updateDisplay();
  };
  
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault(); // allow right-click drawing
  };

  // Expose upload function via ref or just use a passive approach?
  // Let's attach an id to a hidden input out of this component, or listen to an event.
  // We'll manage upload in the parent but pass a ref to internal canvas.
  
  return (
    <>
      <canvas
        ref={internalCanvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="hidden" // Internal canvas is never visible
      />
      <div 
        ref={containerRef}
        className="flex-1 w-full h-full flex items-center justify-center cursor-crosshair overflow-auto"
      >
        <canvas
          ref={displayCanvasRef}
          width={canvasSize.width}
          height={canvasSize.height}
          className="bg-black shadow-2xl border-2 border-gray-600 max-w-[95%] max-h-[95%] object-contain pointer-events-auto"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onContextMenu={handleContextMenu}
        />
      </div>
    </>
  );
}
