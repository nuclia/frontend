export interface IResource {
  id: string;
  slug?: string;
  title?: string;
  summary?: string;
  icon?: string;
  metadata?: Metadata;
  usermetadata?: UserMetadata;
  fieldmetadata?: UserFieldMetadata[];
  origin?: Origin;
  created?: string;
  modified?: string;
  thumbnail?: string;
  last_seqid?: number;
  last_account_seq?: number;

  data?: ResourceData;

  // layouts: Dict[str, models.InputLayoutField] = {}
  // conversations: Dict[str, models.InputConversationField] = {}
  // keywordsets: Dict[str, models.FieldKeywordset] = {}
  // datetimes: Dict[str, models.FieldDatetime] = {}
}

export type ResourceData = {
  files?: { [key: string]: FileFieldData };
  links?: { [key: string]: LinkFieldData };
  texts?: { [key: string]: TextFieldData };
  keywordsets?: { [key: string]: KeywordSetFieldData };
};

export interface ICreateResource {
  title?: string;
  summary?: string;
  slug?: string;
  icon?: string;
  metadata?: Metadata;
  usermetadata?: UserMetadata;
  fieldmetadata?: UserFieldMetadata[];
  origin?: Origin;
  files?: { [key: string]: FileField };
  links?: { [key: string]: LinkField };
  texts?: { [key: string]: TextField };
  keywordsets?: { [key: string]: KeywordSetField };
}

export enum FIELD_TYPE {
  text = 'text',
  file = 'file',
  link = 'link',
  layout = 'layout',
  conversation = 'conversation',
  keywordset = 'keywordset',
  datetime = 'datetime',
}

export enum RESOURCE_STATUS {
  PENDING = 'PENDING',
  PROCESSED = 'PROCESSED',
  ERROR = 'ERROR',
}

export interface Metadata {
  language?: string;
  languages?: string[];
  status?: RESOURCE_STATUS;
}

export interface LabelValue {
  labelset: string;
  label: string;
}

export interface UserMetadata {
  classifications?: LabelValue[];
  relations?: Relation[];
}

export interface Relation {
  relation?: 'CHILD' | 'ABOUT' | 'ENTITY' | 'COLAB' | 'OTHER';
  properties?: { [key: string]: string };
  resource?: string;
  label?: string;
  user?: string;
  other?: string;
  entity?: {
    entity: string;
    entity_type: string;
  };
}

export interface Origin {
  source_id?: string;
  url?: string;
  created?: string;
  modified?: string;
  metadata?: { [key: string]: string };
  tags?: string[];
  colaborators?: string[];
  filename?: string;
  related?: string[];
  source?: 'WEB' | 'DESKTOP' | 'API';
}

export interface IFieldData {
  value?: TextField | FileField | LinkField | KeywordSetField;
  extracted?: ExtractedData;
}

export interface ResourceField extends IFieldData {
  field_type: FIELD_TYPE;
  field_id: string;
}

export class FileFieldData implements IFieldData {
  value?: FileField;
  extracted?: FileFieldExtractedData;
}

export interface FileField {
  added?: string;
  file?: CloudLink;
  language?: string;
  password?: string;
  external?: boolean;
}

export interface FileFieldExtractedData extends ExtractedData {
  file?: FileExtractedData;
}

export interface FileExtractedData {
  language?: string;
  md5?: string;
  metadata?: { [id: string]: string };
  nested?: { [id: string]: string };
  file_generated?: { [id: string]: CloudLink };
  file_rows_previews?: { [id: string]: RowsPreview };
  file_preview?: CloudLink;
  file_pages_previews?: FilePages;
  file_thumbnail?: CloudLink;
  field?: string;
  icon?: string;
  nested_position?: { [id: string]: NestedPosition };
}

export interface NestedPosition {
  start?: number;
  end?: number;
  page?: number;
}

export interface Row {
  cell?: string[];
}

export interface Sheet {
  rows?: Row[];
}

export interface RowsPreview {
  sheets?: { [id: string]: Sheet };
}

export interface WriteFileField {
  language?: string[];
  file: FileB64;
}

export interface PagePositions {
  start?: number;
  end?: number;
}

export interface FilePages {
  pages?: CloudLink[];
  positions?: PagePositions[];
}

export interface FileB64 {
  filename: string;
  content_type?: string;
  payload: string;
  md5: string;
}

export interface LinkField {
  added?: string;
  headers?: { [id: string]: string };
  cookies?: { [id: string]: string };
  uri?: string;
  language?: string;
  localstorage?: { [id: string]: string };
}

export class TextFieldData implements IFieldData {
  value?: TextField;
  extracted?: ExtractedData;
}

export interface TextField {
  body: string;
  format?: 'PLAIN' | 'MARKDOWN' | 'HTML' | 'RST';
}

export interface ExtractedData {
  text?: ExtractedText;
  metadata?: FieldComputedMetadata;
}
export interface ExtractedText {
  text?: string;
  split_text?: { [id: string]: string };
  deleted_splits?: string[];
}

export interface FieldComputedMetadata {
  metadata: FieldMetadata;
}

export interface FieldMetadata {
  links: string[];
  paragraphs: Paragraph[];
  ner: { [id: string]: string };
  classifications: Classification[];
  last_index?: string;
  last_understanding?: string;
  last_extract?: string;
  last_summary?: string;
  thumbnail?: CloudLink;
  language?: string;
  summary?: string;
}

export interface UserFieldMetadata {
  field: { field: string; field_type: string };
  paragraphs?: ParagraphAnnotation[];
  token?: TokenAnnotation[];
}

export interface TokenAnnotation {
  token: string;
  klass: string;
  start: number;
  end: number;
}

export interface ParagraphAnnotation {
  classifications: Classification[];
  key: string;
}

export class KeywordSetFieldData implements IFieldData {
  value?: KeywordSetField;
  extracted?: ExtractedData;
}

export interface KeywordSetField {
  keywords: { value: string }[];
}

export interface Classification {
  labelset: string;
  label: string;
}

export type TypeParagraph = 'TEXT' | 'OCR' | 'INCEPTION' | 'DESCRIPTION' | 'TRANSCRIPT';

export interface Paragraph {
  start?: number;
  end?: number;
  start_seconds?: number[];
  end_seconds?: number[];
  kind?: TypeParagraph;
  classifications?: Classification[];
  sentences?: Sentence[];
  key?: string;
}

export interface Sentence {
  start?: number;
  end?: number;
  key?: string;
}

export interface CloudLink {
  uri?: string;
  size?: number;
  content_type?: string;
  extra_headers?: { [key: string]: string };
}

export class LinkFieldData implements IFieldData {
  value?: LinkField;
  extracted?: LinkFieldExtractedData;
}

export interface LinkFieldExtractedData extends ExtractedData {
  link?: LinkExtractedData;
}

export interface LinkExtractedData {
  date?: string;
  language?: string;
  title?: string;
  metadata?: { [id: string]: string };
  link_thumbnail?: CloudLink;
  link_preview?: CloudLink;
  field?: string;
  link_image?: CloudLink;
  description?: string;
  type?: string;
  embed?: string;
}
