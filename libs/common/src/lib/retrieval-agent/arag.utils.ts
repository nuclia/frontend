export function getListFromTextarea(value: string): string[] {
  return (value || '')
    .trim()
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => !!item);
}

export function getFormattedCost(timing: number, input: number, output: number): string {
  return `${(timing / 1000).toFixed(3)}s | ${input.toFixed(3)} input tokens | ${output.toFixed(3)} output tokens`;
}
