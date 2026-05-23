import { Point, Tool, ASCIICHARS } from '../types';

export function floodFill(ctx: CanvasRenderingContext2D, x: number, y: number, color: string) {
  const canvas = ctx.canvas;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const { width, height } = canvas;

  // Get target color
  const tPixel = (y * width + x) * 4;
  const tR = data[tPixel];
  const tG = data[tPixel + 1];
  const tB = data[tPixel + 2];
  const tA = data[tPixel + 3];

  // Parse fill color
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = 1; tempCanvas.height = 1;
  const tempCtx = tempCanvas.getContext('2d')!;
  tempCtx.fillStyle = color;
  tempCtx.fillRect(0, 0, 1, 1);
  const fillData = tempCtx.getImageData(0, 0, 1, 1).data;
  const fR = fillData[0];
  const fG = fillData[1];
  const fB = fillData[2];
  const fA = fillData[3];

  if (tR === fR && tG === fG && tB === fB && tA === fA) return;

  const stack: Point[] = [{ x, y }];
  const processed = new Uint8Array(width * height);

  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    let nx = x;
    while (nx > 0 && matchColor(data, (y * width + nx - 1) * 4, tR, tG, tB, tA)) {
      nx--;
    }
    let spanUp = false;
    let spanDown = false;
    while (nx < width && matchColor(data, (y * width + nx) * 4, tR, tG, tB, tA)) {
      setColor(data, (y * width + nx) * 4, fR, fG, fB, fA);
      processed[y * width + nx] = 1;
      if (y > 0) {
        const topMatch = matchColor(data, ((y - 1) * width + nx) * 4, tR, tG, tB, tA);
        if (!spanUp && topMatch) {
          stack.push({ x: nx, y: y - 1 });
          spanUp = true;
        } else if (spanUp && !topMatch) {
          spanUp = false;
        }
      }
      if (y < height - 1) {
        const bottomMatch = matchColor(data, ((y + 1) * width + nx) * 4, tR, tG, tB, tA);
        if (!spanDown && bottomMatch) {
          stack.push({ x: nx, y: y + 1 });
          spanDown = true;
        } else if (spanDown && !bottomMatch) {
          spanDown = false;
        }
      }
      nx++;
    }
  }
  ctx.putImageData(imageData, 0, 0);
}

function matchColor(data: Uint8ClampedArray, i: number, r: number, g: number, b: number, a: number) {
  return data[i] === r && data[i + 1] === g && data[i + 2] === b && data[i + 3] === a;
}

function setColor(data: Uint8ClampedArray, i: number, r: number, g: number, b: number, a: number) {
  data[i] = r;
  data[i + 1] = g;
  data[i + 2] = b;
  data[i + 3] = a;
}

// Convert RGB to HSV
function rgbToHsv(r: number, g: number, b: number) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max !== min) {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h, s, v };
}

function hsvToRgb(h: number, s: number, v: number) {
  let r, g, b;
  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let p = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);
  switch (i % 6) {
    case 0: r = v, g = t, b = p; break;
    case 1: r = q, g = v, b = p; break;
    case 2: r = p, g = v, b = t; break;
    case 3: r = p, g = q, b = v; break;
    case 4: r = t, g = p, b = v; break;
    case 5: r = v, g = p, b = q; break;
    default: r = 0, g = 0, b = 0;
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

export function renderAscii(
  sourceCtx: CanvasRenderingContext2D,
  destCtx: CanvasRenderingContext2D,
  fontSize: number,
  useCurvature: boolean
) {
  const sCanvas = sourceCtx.canvas;
  const dCanvas = destCtx.canvas;
  const width = sCanvas.width;
  const height = sCanvas.height;

  // Copy standard background
  destCtx.fillStyle = '#000000';
  destCtx.fillRect(0, 0, dCanvas.width, dCanvas.height);

  const imgData = sourceCtx.getImageData(0, 0, width, height);
  const data = imgData.data;

  // Cell size calculation based on font size.
  // Using monospace font. Height is usually fontSize. Width is usually ~0.6 * fontSize.
  const cellH = fontSize;
  const cellW = Math.max(1, Math.floor(fontSize * 0.6));

  destCtx.font = `${fontSize}px "Courier New", monospace`;
  destCtx.textBaseline = 'top';

  for (let y = 0; y < height; y += cellH) {
    for (let x = 0; x < width; x += cellW) {
      let rSum = 0, gSum = 0, bSum = 0, count = 0;
      
      // Calculate average color in block
      const ey = Math.min(y + cellH, height);
      const ex = Math.min(x + cellW, width);
      for (let cy = y; cy < ey; cy++) {
        for (let cx = x; cx < ex; cx++) {
          const idx = (cy * width + cx) * 4;
          rSum += data[idx];
          gSum += data[idx + 1];
          bSum += data[idx + 2];
          count++;
        }
      }
      
      if (count === 0) continue;
      const avgR = rSum / count;
      const avgG = gSum / count;
      const avgB = bSum / count;
      
      // Black background means if it's very dark, don't draw anything (or draw space).
      const pLuminance = (0.299 * avgR + 0.587 * avgG + 0.114 * avgB);
      if (pLuminance < 10) continue;

      const { h, s, v } = rgbToHsv(avgR, avgG, avgB);
      
      // Ascii char based on s and v (or just luminance)
      // High value & high sat -> strong character. High value, low sat -> strong char.
      // Let's use luminance for char selection.
      let charIdx = Math.floor((pLuminance / 255) * (ASCIICHARS.length - 1));
      charIdx = Math.max(0, Math.min(charIdx, ASCIICHARS.length - 1));
      let char = ASCIICHARS[charIdx];

      if (useCurvature && pLuminance > 20) {
        // Calculate gradient for curvature
        const cx = Math.floor(x + cellW / 2);
        const cy = Math.floor(y + cellH / 2);
        
        if (cx > 0 && cx < width - 1 && cy > 0 && cy < height - 1) {
          const idxTop = ((cy - 1) * width + cx) * 4;
          const idxBottom = ((cy + 1) * width + cx) * 4;
          const idxLeft = (cy * width + cx - 1) * 4;
          const idxRight = (cy * width + cx + 1) * 4;
          
          const lumTop = (0.299 * data[idxTop] + 0.587 * data[idxTop+1] + 0.114 * data[idxTop+2]);
          const lumBottom = (0.299 * data[idxBottom] + 0.587 * data[idxBottom+1] + 0.114 * data[idxBottom+2]);
          const lumLeft = (0.299 * data[idxLeft] + 0.587 * data[idxLeft+1] + 0.114 * data[idxLeft+2]);
          const lumRight = (0.299 * data[idxRight] + 0.587 * data[idxRight+1] + 0.114 * data[idxRight+2]);
          
          const gx = lumRight - lumLeft;
          const gy = lumBottom - lumTop;
          const gMag = Math.sqrt(gx*gx + gy*gy);
          
          if (gMag > 30) {
            const angle = Math.atan2(gy, gx) * 180 / Math.PI;
            // Map angle to closest character
            const a = (angle + 360) % 180; // 0 to 180
            if (a < 22.5 || a > 157.5) char = '|'; // horizontal gradient -> vertical edge
            else if (a >= 22.5 && a < 67.5) char = '\\';
            else if (a >= 67.5 && a < 112.5) char = '-';
            else if (a >= 112.5 && a <= 157.5) char = '/';
          }
        }
      }

      // Restore color using Hue but saturated for text drawing
      // We want vivid colors for text
      const renderHsv = { h, s: 1.0, v: 1.0 }; // Force max saturation/value for color to pop?
      // Actually user said: Text color is Hue.
      // Or maybe keep s and v, but clamp v higher.
      const TextRGB = hsvToRgb(h, Math.max(0.5, s), Math.max(0.7, v));
      
      // If it's pure grayscale (s=0), make it white/gray based on luminance
      destCtx.fillStyle = s < 0.1 ? `rgb(${pLuminance},${pLuminance},${pLuminance})` : `rgb(${TextRGB.r}, ${TextRGB.g}, ${TextRGB.b})`;
      destCtx.fillText(char, x, y);
    }
  }
}
