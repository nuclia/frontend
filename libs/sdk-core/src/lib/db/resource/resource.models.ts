export interface IResource {
  id: string;
  slug?: string;
  title?: string;
  summary?: string;
  icon?: string;
  metadata?: Metadata;
  usermetadata?: UserMetadata;
  fieldmetadata?: UserFieldMetadata[];
  computedmetadata?: ComputedMetadata;
  extra?: ExtraMetadata;
  origin?: Origin;
  created?: string;
  modified?: string;
  thumbnail?: string;
  last_seqid?: number;
  last_account_seq?: number;
  queue?: 'private' | 'shared';

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
  conversations?: { [key: string]: ConversationField };
}

export enum FIELD_TYPE {
  text = 'text',
  file = 'file',
  link = 'link',
  layout = 'layout',
  conversation = 'conversation',
  keywordset = 'keywordset',
  datetime = 'datetime',
  generic = 'generic',
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

export interface UserMetadata {
  classifications?: UserClassification[];
  relations?: Relation[];
}

export interface ExtraMetadata {
  metadata: object;
}

export type RelationType = 'ABOUT' | 'CHILD' | 'COLAB' | 'ENTITY' | 'OTHER' | 'SYNONYM';
export type RelationEntityType = 'entity' | 'label' | 'resource' | 'user';

export interface Relation {
  relation: RelationType;
  label?: string;
  from?: RelationEntity;
  to: RelationEntity;
}

export interface RelationEntity {
  value: string;
  type: RelationEntityType;
  group?: string;
}

export interface Origin {
  source_id?: string;
  url?: string;
  created?: string;
  modified?: string;
  metadata?: { [key: string]: string };
  tags?: string[];
  collaborators?: string[];
  filename?: string;
  related?: string[];
  source?: 'WEB' | 'DESKTOP' | 'API';
}

export interface IError {
  body: string;
  code: number;
}

export interface IFieldData {
  value?: TextField | FileField | LinkField | KeywordSetField | ConversationField;
  extracted?: ExtractedData;
  error?: IError;
}

export interface FieldId {
  field_type: FIELD_TYPE;
  field_id: string;
}

export interface FieldFullId extends FieldId {
  resourceId: string;
}

export interface ResourceField extends IFieldData, FieldId {}

export class FileFieldData implements IFieldData {
  value?: FileField;
  extracted?: FileFieldExtractedData;
  error?: IError;
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
  error?: IError;
}

export type TextFormat = 'PLAIN' | 'MARKDOWN' | 'HTML' | 'RST';

export type TextFieldFormat = TextFormat | 'JSON';

export interface TextField {
  body: string;
  format?: TextFieldFormat;
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
  split_metadata?: { [id: string]: FieldMetadata };
  deleted_splits?: string[];
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
  positions?: EntityPositions;
  relations?: Relation[];
}

export interface EntityPositions {
  [entityId: string]: EntityPosition;
}

export interface EntityPosition {
  entity: string;
  position: { start: number; end: number }[];
}

export interface UserFieldMetadata {
  field: { field: string; field_type: string };
  paragraphs?: ParagraphClassification[];
  token?: UserTokenAnnotation[];
}

export interface TokenAnnotation {
  token: string;
  klass: string;
  start: number;
  end: number;
}

export interface UserTokenAnnotation extends TokenAnnotation {
  cancelled_by_user?: boolean;
}

export interface ParagraphClassification {
  classifications: Classification[];
  key: string;
}

export class KeywordSetFieldData implements IFieldData {
  value?: KeywordSetField;
  extracted?: ExtractedData;
  error?: IError;
}

export interface KeywordSetField {
  keywords: { value: string }[];
}

export interface Classification {
  labelset: string;
  label: string;
  immutable?: boolean;
}

export interface UserClassification extends Classification {
  cancelled_by_user?: boolean;
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
  filename?: string;
  md5?: string;
  uri?: string;
  size?: number;
  content_type?: string;
  extra_headers?: { [key: string]: string };
}

export class LinkFieldData implements IFieldData {
  value?: LinkField;
  extracted?: LinkFieldExtractedData;
  error?: IError;
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

export interface PositionedNER {
  entity: string;
  family: string;
  start: number;
  end: number;
}

export interface ComputedMetadata {
  field_classifications: FieldClassification[];
}

export interface FieldClassification {
  field: FieldId;
  classifications: Classification[];
}

export class ConversationFieldData implements IFieldData {
  value?: ConversationField;
  extracted?: ExtractedData;
  error?: IError;
}

export interface ConversationField {
  messages: Message[];
}

export interface Message {
  ident: string;
  content: MessageContent;
  timestamp?: string;
  who?: string;
  to?: string[];
  type?: 'QUESTION' | 'ANSWER';
}

export interface MessageContent {
  text: string;
  format?: TextFormat;
  attachments?: MessageAttachment[];
}

export interface MessageAttachment {
  filename: string;
  content_type?: string;
  payload: string;
  md5: string;
}
