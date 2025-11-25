import { JSONSchema4 } from 'json-schema';

export function convertNodeTypeToConfigTitle(nodeType: string, schemas: JSONSchema4 | null): string {
  if (!schemas) {
    return '';
  }
  // get all mappings
  const mappings = Object.entries(schemas.properties || {}).reduce(
    (all, [key, curr]) => {
      if (key === 'drivers') {
        return all;
      }
      const mapping = (curr?.items as JSONSchema4)?.['discriminator']?.mapping as { [key: string]: string };
      if (mapping) {
        Object.entries(mapping).forEach(([key, title]) => {
          title = title.split('/').slice(-1)[0];
          all[key] = title;
        });
      }
      return all;
    },
    {} as { [key: string]: string },
  );
  return mappings[nodeType];
}
