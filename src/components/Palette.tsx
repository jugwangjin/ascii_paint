import React from 'react';
import { AppState } from '../types';

interface PaletteProps {
  appState: AppState;
  setAppState: React.Dispatch<React.SetStateAction<AppState>>;
}

const COLORS = [
  '#000000', '#808080', '#800000', '#808000', '#008000', '#008080', '#000080', '#800080',
  '#ffffff', '#c0c0c0', '#ff0000', '#ffff00', '#00ff00', '#00ffff', '#0000ff', '#ff00ff'
];

export function Palette({ appState, setAppState }: PaletteProps) {
  
  const handleColorClick = (color: string, isRightClick: boolean) => {
    if (isRightClick) {
      setAppState(s => ({ ...s, secondaryColor: color }));
    } else {
      setAppState(s => ({ ...s, primaryColor: color }));
    }
  };

  return (
    <div className="flex h-full items-center gap-2">
      <div className="w-8 h-8 border-t-gray-800 border-l-gray-800 border-r-white border-b-white border bg-white flex items-center justify-center shrink-0 relative">
         <div 
           className="w-4 h-4 absolute top-3 left-3 border border-black shadow-inner z-0" 
           style={{ backgroundColor: appState.secondaryColor }} 
         />
         <div 
           className="w-4 h-4 absolute top-1 left-1 border border-black shadow-inner z-10" 
           style={{ backgroundColor: appState.primaryColor }} 
         />
      </div>

      <div className="grid grid-rows-2 grid-flow-col gap-[1px] border border-gray-400 p-[1px] bg-gray-200">
        {COLORS.map((c, i) => (
          <div
            key={i}
            className="w-4 h-4 border border-gray-600 cursor-pointer shadow-sm hover:border-white"
            style={{ backgroundColor: c }}
            onClick={() => handleColorClick(c, false)}
            onContextMenu={(e) => {
              e.preventDefault();
              handleColorClick(c, true);
            }}
          />
        ))}
      </div>
    </div>
  );
}
