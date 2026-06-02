export function getListFromTextarea(value: string): string[] {
  return (value || '')
    .trim()
    .split('\n')
    .map((item) => item.trim())
    .filter((item) => !!item);
}

export function getFormattedCost(timing: number, input = 0, output = 0): string {
  return `${timing.toFixed(2)}s | ${(input || 0).toFixed(3)} input tokens | ${(output || 0).toFixed(3)} output tokens`;
}

export function getKeyValueInputType(property: any): string {
  if (!property?.additionalProperties) return 'text';
  const additionalProps = property.additionalProperties;
  if (additionalProps.type === 'number') return 'number';
  if (additionalProps.type === 'string') return 'text';
  if (additionalProps.anyOf) {
    const hasNumber = additionalProps.anyOf.some((item: any) => item.type === 'number');
    if (hasNumber) return 'number';
  }
  return 'text';
}
