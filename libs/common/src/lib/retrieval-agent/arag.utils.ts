export function getListFromTextarea(value: string): string[] {
  return (value || '')
    .trim()
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => !!item);
}

export function getFormattedCost(timing: number, input: number = 3, output: number = 0): string {
  return `${(timing / 1000).toFixed(3)}s | ${(input || 0).toFixed(3)} input tokens | ${(output || 0).toFixed(
    3,
  )} output tokens`;
}
