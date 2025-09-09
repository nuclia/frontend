export enum Duration {
  SUPERFAST = 160,
  FAST = 240,
  MODERATE = 480,
  SLOW = 800,
}

export function isMobileViewport(innerWidth: number): boolean {
  return innerWidth < 448;
}

const rtlChar = /[\u0590-\u083F]|[\u08A0-\u08FF]|[\uFB1D-\uFDFF]|[\uFE70-\uFEFF]/gm;
export function isRightToLeft(text: string): boolean {
  return (text.match(rtlChar)?.length || 0) > text.length / 2;
}
