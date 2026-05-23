export type Tool = 'pencil' | 'eraser' | 'line' | 'rect' | 'circle' | 'fill';

export interface Point {
  x: number;
  y: number;
}

export interface AppState {
  currentTool: Tool;
  primaryColor: string;
  secondaryColor: string;
  fontSize: number;
  useCurvature: boolean;
}

export const ASCIICHARS = " `.-':_,^=;><+!rc*/z?sLTv)J7(|Fi{C}fI31tlu[neoZ5Yxjya]2ESwqkP6h9d4VpOGbUAKXHm8RD#$Bg0MNWQ%&@";
export const CURVATURE_CHARS_V = "|Il!";
export const CURVATURE_CHARS_H = "-_=~";
export const CURVATURE_CHARS_D1 = "/7";
export const CURVATURE_CHARS_D2 = "\\`";
