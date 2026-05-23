import React from 'react';
import { AppState, Tool } from '../types';
import { Pencil, Eraser, Minus, Square, Circle, PaintBucket, Type } from 'lucide-react';

interface ToolbarProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClear: () => void;
}

export function Toolbar({ appState, setAppState, onFileChange, onClear }: ToolbarProps) {
  
  const ToolButton = ({ tool, Icon, title }: { tool: Tool, Icon: React.ElementType, title: string }) => {
    const isActive = appState.currentTool === tool;
    return (
      <button 
        className={`w-5 h-5 flex items-center justify-center text-[10px] cursor-pointer ${
          isActive 
            ? 'bg-[#e0e0e0] border-t-gray-800 border-l-gray-800 border-r-white border-b-white border shadow-inner' 
            : 'bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border hover:bg-gray-200 active:border-t-gray-800 active:border-l-gray-800 active:border-r-white active:border-b-white'
        }`}
        onClick={() => setAppState(s => ({ ...s, currentTool: tool }))}
        title={title}
      >
        <Icon size={12} strokeWidth={2} className={`${isActive ? 'opacity-100' : 'opacity-80'}`} />
      </button>
    );
  };

  return (
    <div className="w-12 bg-[#c0c0c0] border-t-white border-l-white border-r-gray-800 border-b-gray-800 border flex flex-col items-center py-2 gap-2 shrink-0">
      <div className="grid grid-cols-2 gap-1 px-1 mb-2">
        <ToolButton tool="pencil" Icon={Pencil} title="Pencil" />
        <ToolButton tool="eraser" Icon={Eraser} title="Eraser" />
        <ToolButton tool="fill" Icon={PaintBucket} title="Fill" />
        <ToolButton tool="line" Icon={Minus} title="Line" />
        <ToolButton tool="rect" Icon={Square} title="Rectangle" />
        <ToolButton tool="circle" Icon={Circle} title="Circle" />
      </div>

      <div className="mt-4 border-t border-gray-400 border-b border-b-white pt-4 w-full flex flex-col items-center gap-3 relative">
        <div className="w-8 h-12 border-t-gray-800 border-l-gray-800 border-r-white border-b-white border bg-white relative">
          <div 
            className="absolute bottom-0 left-0 w-full bg-blue-500" 
            style={{ height: `${(appState.fontSize / 24) * 100}%` }}
          />
        </div>
        <div className="text-[8px] font-bold text-center uppercase leading-tight">Brush<br/>Size</div>
      </div>
    </div>
  );
}
