export enum Duration {
  SUPERFAST = 160,
  FAST = 240,
  MODERATE = 480,
  SLOW = 800,
}

export function isMobileViewport(innerWidth: number): boolean {
  return innerWidth < 448;
}
