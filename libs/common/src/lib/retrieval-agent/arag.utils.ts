export function getListFromTextarea(value: string): string[] {
  return (value || '')
    .trim()
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => !!item);
}

export function getFormattedCost(timing: number, input: number = 0, output: number = 0): string {
  return `${timing.toFixed(2)}s | ${(input || 0).toFixed(3)} input tokens | ${(output || 0).toFixed(3)} output tokens`;
}
