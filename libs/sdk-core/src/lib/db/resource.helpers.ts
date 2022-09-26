import type { ParagraphAnnotation, UserFieldMetadata } from './resource.models';

export const concatAndDeDuplicateLists = (a: any[], b: any[]): any[] => {
  return [...new Set([...a, ...b].map((item) => JSON.stringify(item)))].map((item) => JSON.parse(item));
};

export const addFieldMetadata: (allEntries: UserFieldMetadata[], newEntry: UserFieldMetadata) => UserFieldMetadata[] = (
  allEntries: UserFieldMetadata[],
  newEntry: UserFieldMetadata,
) => {
  // find entry having same field id and same field type
  const existingEntry = allEntries.find(
    (entry) => entry.field.field === newEntry.field.field && entry.field.field_type === newEntry.field.field_type,
  );
  if (existingEntry) {
    if (existingEntry.paragraphs || newEntry.paragraphs) {
      const paragraphsById = [...(existingEntry.paragraphs || []), ...(newEntry.paragraphs || [])].reduce(
        (acc, paragraph) => {
          const existing = acc[paragraph.key];
          if (!existing) {
            acc[paragraph.key] = paragraph;
          } else {
            // merge classifications and make sure they are unique
            existing.classifications = concatAndDeDuplicateLists(
              existing.classifications || [],
              paragraph.classifications || [],
            );
          }
          return acc;
        },
        {} as { [key: string]: ParagraphAnnotation },
      );
      existingEntry.paragraphs = Object.values(paragraphsById);
    }

    if (existingEntry.token || newEntry.token) {
      existingEntry.token = concatAndDeDuplicateLists(existingEntry.token || [], newEntry.token || []);
    }
    return allEntries;
  } else {
    return [...allEntries, newEntry];
  }
};
