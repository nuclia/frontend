import { Resource } from './resource';
import { Classification } from '@nuclia/core';
import { map, Observable } from 'rxjs';

interface Record {
  title?: string;
  fullText?: string[];
  images?: string[];
}

export const resourceToAlgoliaFormat = (resource: Resource): Observable<Record> => {
  const record: Record = {
    title: resource.title,
    fullText: resource
      .getExtractedTexts()
      .filter((extracted) => extracted)
      .map((extracted) => extracted.text as string),
  };

  // The typing is incorrect: the type is usermetadata while what we really got is user_metadata (but usermetadata is in use in other places, so we need to be careful when fixing it)
  (resource as any).user_metadata?.classifications?.forEach((classification: Classification) => {
    if (classification.labelset && classification.label) {
      // Adding labels as properties of the final json
      (record as any)[classification.labelset] = classification.label;
    }
  });

  return resource.getThumbnailsUrl().pipe(
    map((images) => {
      return { ...record, images, ...resource.getNamedEntities() };
    }),
  );
};
