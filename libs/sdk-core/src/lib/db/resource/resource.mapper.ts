import type { Resource } from './resource';
import type { Classification } from '@nuclia/core';

interface AlgoliaRecord {
  title?: string;
  fullText?: string[];
  images?: string[];
}

export const resourceToAlgoliaFormat = (resource: Resource, backend: string): AlgoliaRecord => {
  const record: AlgoliaRecord = {
    title: resource.title,
    fullText: resource
      .getExtractedTexts()
      .filter((extracted) => extracted)
      .map((extracted) => extracted.text as string),
  };

  resource.usermetadata?.classifications?.forEach((classification: Classification) => {
    if (classification.labelset && classification.label) {
      // Adding labels as properties of the final json
      (record as any)[classification.labelset] = classification.label;
    }
  });

  const images = resource
    .getThumbnails()
    .filter((link) => !!link.uri)
    .map((link) => `${backend}/v1${link.uri}`);

  return { ...record, images, ...resource.getNamedEntities() };
};
