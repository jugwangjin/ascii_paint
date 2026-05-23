import React, { useState, useRef, useEffect } from 'react';
import { AppState } from '../types';
import { Toolbar } from './Toolbar';
import { Palette } from './Palette';
import { CanvasArea, CanvasAreaRef } from './CanvasArea';
import { renderAscii, generateAsciiArt } from '../lib/paint';

export function PaintApp() {
  const canvasRef = useRef<CanvasAreaRef>(null);

  const [appState, setAppState] = useState<AppState>({
    currentTool: 'pencil',
    primaryColor: '#ffffff',
    secondaryColor: '#000000',
    fontSize: 10,
    useCurvature: false,
  });

  const [canvasSize, setCanvasSize] = useState({ width: 540, height: 960 });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const iCanvas = document.querySelector('canvas.hidden') as HTMLCanvasElement;
        const dCanvas = document.querySelector('canvas:not(.hidden)') as HTMLCanvasElement;
        if (iCanvas && dCanvas) {
          const ctx = iCanvas.getContext('2d');
          if (ctx) {
            // Draw image on internal canvas
            // Maybe scale to fit
            const scale = Math.min(canvasSize.width / img.width, canvasSize.height / img.height, 1);
            const w = img.width * scale;
            const h = img.height * scale;
            const x = (canvasSize.width - w) / 2;
            const y = (canvasSize.height - h) / 2;
            
            // Do not clear bg, just draw over
            ctx.drawImage(img, x, y, w, h);
            
            const dCtx = dCanvas.getContext('2d');
            if (dCtx) {
              renderAscii(ctx, dCtx, appState.fontSize, appState.useCurvature);
            }
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const clearCanvas = () => {
    const iCanvas = document.querySelector('canvas.hidden') as HTMLCanvasElement;
    const dCanvas = document.querySelector('canvas:not(.hidden)') as HTMLCanvasElement;
    if (iCanvas && dCanvas) {
      const ctx = iCanvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#000000'; // Always clear with black
        ctx.fillRect(0, 0, canvasSize.width, canvasSize.height);
        
        const dCtx = dCanvas.getContext('2d');
        if (dCtx) {
          renderAscii(ctx, dCtx, appState.fontSize, appState.useCurvature);
        }
      }
    }
  };

  const handleSave = () => {
    const dCanvas = document.querySelector('canvas:not(.hidden)') as HTMLCanvasElement;
    if (dCanvas) {
      const link = document.createElement('a');
      link.download = 'ascii_paint.png';
      link.href = dCanvas.toDataURL();
      link.click();
    }
  };

  const handleExportText = () => {
    const iCanvas = document.querySelector('canvas.hidden') as HTMLCanvasElement;
    if (iCanvas) {
      const ctx = iCanvas.getContext('2d');
      if (ctx) {
        const text = generateAsciiArt(ctx, appState.fontSize, appState.useCurvature, 'txt');
        const blob = new Blob([text], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = 'ascii_paint.txt';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }
  };

  const handleExportHtml = () => {
    const iCanvas = document.querySelector('canvas.hidden') as HTMLCanvasElement;
    if (iCanvas) {
      const ctx = iCanvas.getContext('2d');
      if (ctx) {
        const html = generateAsciiArt(ctx, appState.fontSize, appState.useCurvature, 'html');
        const blob = new Blob([html], { type: 'text/html' });
        const link = document.createElement('a');
        link.download = 'ascii_paint.html';
        link.href = URL.createObjectURL(blob);
        link.click();
      }
    }
  };

  const handleUndo = () => {
    canvasRef.current?.undo();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        handleUndo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close and minimize buttons are just visual in this demo, maybe maximize expands the wrapper.
  return (
    <div className="w-[600px] h-[1000px] max-w-full max-h-screen bg-[#c0c0c0] flex flex-col font-['Tahoma',_sans-serif] select-none overflow-hidden text-[#000] border border-gray-400 shadow-2xl">
      
      {/* Title Bar */}
      <div className="bg-gradient-to-r from-[#000080] to-[#1084d0] p-1 flex justify-between items-center shrink-0">
        <div className="flex items-center gap-2 px-1">
           <div className="w-4 h-4 bg-white rounded-sm flex items-center justify-center">
             <span className="text-[8px] font-bold text-black">A</span>
           </div>
           <span className="text-white font-bold text-xs tracking-tight">ASCII Paint Pro - [Untitled]</span>
        </div>
        <div className="flex gap-1">
          <button className="w-5 h-5 bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border shadow-sm flex items-center justify-center font-bold text-xs pb-1 hover:bg-[#e0e0e0] active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white">-</button>
          <button className="w-5 h-5 bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border shadow-sm flex items-center justify-center font-bold text-[10px] hover:bg-[#e0e0e0] active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white">&#x25A1;</button>
          <button className="w-5 h-5 bg-red-600 border-t-red-400 border-l-red-400 border-r-red-950 border-b-red-950 border shadow-sm flex items-center justify-center font-bold text-xs text-white hover:bg-red-500 active:border-t-red-950 active:border-l-red-950 active:border-r-red-400 active:border-b-red-400">&times;</button>
        </div>
      </div>

      {/* Menu Bar */}
      <div className="flex px-2 py-1 border-b border-gray-400 gap-4 text-xs shrink-0 text-[#000]">
        <div className="group relative">
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">File</span>
          <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border p-1 z-50 text-black">
            <label className="cursor-pointer hover:bg-blue-800 hover:text-white px-2 py-1 whitespace-nowrap">
              Open Image...
              <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </label>
            <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-2 py-1 whitespace-nowrap" onClick={handleSave}>Save as Image (.png)</span>
            <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-2 py-1 whitespace-nowrap" onClick={handleExportText}>Export as Text (.txt)</span>
            <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-2 py-1 whitespace-nowrap" onClick={handleExportHtml}>Export as HTML (.html)</span>
          </div>
        </div>
        <div className="group relative">
          <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">Edit</span>
          <div className="absolute left-0 top-full hidden group-hover:flex flex-col bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border p-1 z-50 text-black">
            <span className="cursor-pointer hover:bg-blue-800 hover:text-white px-2 py-1 whitespace-nowrap text-left" onClick={handleUndo}>Undo (Ctrl+Z)</span>
          </div>
        </div>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">View</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">Image</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">Colors</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">Help</span>
      </div>

      {/* Main Content Area */}
      <div className="flex-grow flex bg-[#808080] p-1 gap-1 overflow-hidden">
        
        {/* Toolbar sidebar */}
        <Toolbar 
          appState={appState} 
          setAppState={setAppState} 
          onFileChange={handleFileChange}
          onClear={clearCanvas}
        />

        {/* Canvas container */}
        <div className="flex-grow flex flex-col gap-1 overflow-hidden">
          <div className="flex-grow bg-[#404040] border-t-gray-800 border-l-gray-800 border-r-white border-b-white border relative overflow-hidden flex items-center justify-center shadow-inner">
            <CanvasArea ref={canvasRef} appState={appState} setAppState={setAppState} canvasSize={canvasSize} />
          </div>
          
          {/* Secondary toolbar merged into Palette area based on design */}
          <div className="h-20 bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border flex flex-wrap justify-between items-center px-3 gap-4 shrink-0 overflow-x-auto text-[10px] text-gray-800">
            <div className="flex flex-col gap-1 w-32 shrink-0">
              <div className="flex justify-between text-[9px] font-bold uppercase"><span>Font Size</span><span className="text-blue-700">{appState.fontSize}px</span></div>
              <input 
                type="range" 
                className="w-full appearance-none bg-gray-400 h-1 rounded-full outline-none cursor-pointer" 
                min="6" max="24" step="2"
                value={appState.fontSize}
                onChange={(e) => setAppState(s => ({...s, fontSize: parseInt(e.target.value)}))}
              />
            </div>
            <div className="flex gap-6 items-center">
              <label className="flex items-center gap-2 text-[10px] font-bold cursor-pointer">
                <input 
                  type="checkbox" 
                  className="w-3 h-3" 
                  checked={appState.useCurvature}
                  onChange={(e) => setAppState(s => ({ ...s, useCurvature: e.target.checked }))}
                /> 
                CURVATURE
              </label>
            </div>
            <div className="ml-auto flex gap-2">
              <button className="bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border px-3 py-1.5 text-[10px] font-bold shadow-sm active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white hover:bg-gray-200 uppercase" onClick={handleExportText}>Export .TXT</button>
              <button className="bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border px-3 py-1.5 text-[10px] font-bold shadow-sm active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white hover:bg-gray-200 uppercase" onClick={clearCanvas}>Clear Canvas</button>
            </div>
          </div>
        </div>
      </div>

      {/* Status Bar / Palette Area */}
      <div className="h-10 bg-[#c0c0c0] border-t-white border-t flex items-center px-1 gap-2 shrink-0">
        <Palette appState={appState} setAppState={setAppState} />
        
        <div className="ml-auto border-l-gray-800 border-t-gray-800 border-r-white border-b-white border bg-[#c0c0c0] px-4 h-7 flex items-center text-[10px] gap-6 text-gray-800 font-bold shrink-0">
          <span className="flex items-center gap-1"><span className="text-[8px] opacity-50">SIZE</span> {canvasSize.width} x {canvasSize.height}</span>
          <span className="text-blue-900 border-l border-gray-400 pl-4">ASCII_V_97.dll Loaded</span>
        </div>
      </div>

    </div>
  );
}
