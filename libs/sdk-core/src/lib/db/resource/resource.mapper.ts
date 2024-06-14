import type { Resource } from './resource';
import { Classification, FIELD_TYPE, ResourceData } from './resource.models';
import { SHORT_FIELD_TYPE } from '../search';

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

  resource.getClassifications().forEach((classification: Classification) => {
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

/**
 * Currently in our models, there are more FIELD_TYPEs than ResourceData keys, so we need the switch for typing reason
 */
export const getDataKeyFromFieldType = (fieldType: FIELD_TYPE): keyof ResourceData | null => {
  switch (fieldType) {
    case FIELD_TYPE.text:
    case FIELD_TYPE.file:
    case FIELD_TYPE.link:
    case FIELD_TYPE.conversation:
      return `${fieldType}s`;
    default:
      return null;
  }
};

export function longToShortFieldType(fieldType: FIELD_TYPE): SHORT_FIELD_TYPE {
  return SHORT_FIELD_TYPE[fieldType];
}

export function shortToLongFieldType(shortType: SHORT_FIELD_TYPE): FIELD_TYPE | null {
  switch (shortType) {
    case SHORT_FIELD_TYPE.conversation:
      return FIELD_TYPE.conversation;
    case SHORT_FIELD_TYPE.file:
      return FIELD_TYPE.file;
    case SHORT_FIELD_TYPE.link:
      return FIELD_TYPE.link;
    case SHORT_FIELD_TYPE.text:
      return FIELD_TYPE.text;
    case SHORT_FIELD_TYPE.generic:
      return FIELD_TYPE.generic;
    default:
      return null;
  }
}

export function getFieldTypeFromString(type: string): FIELD_TYPE | null {
  switch (type) {
    case FIELD_TYPE.file:
      return FIELD_TYPE.file;
    case FIELD_TYPE.link:
      return FIELD_TYPE.link;
    case FIELD_TYPE.text:
      return FIELD_TYPE.text;
    case FIELD_TYPE.conversation:
      return FIELD_TYPE.conversation;
    case FIELD_TYPE.generic:
      return FIELD_TYPE.generic;
    default:
      return null;
  }
}
