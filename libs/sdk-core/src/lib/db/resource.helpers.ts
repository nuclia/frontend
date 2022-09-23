import type { UserFieldMetadata, ParagraphAnnotation } from './resource.models';

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
            existing.classifications = [
              ...new Set([...(existing.classifications || []), ...(paragraph.classifications || [])]),
            ];
          }
          return acc;
        },
        {} as { [key: string]: ParagraphAnnotation },
      );
      existingEntry.paragraphs = Object.values(paragraphsById);
    }
    existingEntry.token =
      existingEntry.token || newEntry.token ? [...(existingEntry.token || []), ...(newEntry.token || [])] : undefined;
    return allEntries;
  } else {
    return [...allEntries, newEntry];
  }
};
