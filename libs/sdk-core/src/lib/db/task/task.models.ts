export type TaskName =
  | 'labeler'
  | 'llm-graph'
  | 'synthetic-questions'
  | 'ask'
  | 'llama-guard'
  | 'prompt-guard'
  | 'semantic-model-migrator';
export type ApplyOption = 'ALL' | 'EXISTING' | 'NEW';

/**
 * Minimum definition of a task.
 */
export interface TaskDefinition {
  name: TaskName;
  data_augmentation: boolean;
  description?: string;
  can_cleanup?: boolean;
}

/**
 * Full definition of a task, including its schema.
 */
export interface TaskFullDefinition extends TaskDefinition {
  validation: {
    $defs: { [property: string]: any };
    properties: { [property: string]: any };
    required: string[];
    title: string;
    type: 'object';
  };
}

/**
 * Whether the task applies to the text blocks only or to the full field.
 */
export enum TaskApplyTo {
  TEXT_BLOCKS = 0,
  FULL_FIELD = 1,
}

/**
 * Definition of the operation done by the task
 */
export interface Operation {
  label?: LabelOperation;
  graph?: GraphOperation;
  qa?: QAOperation;
  prompt_guard?: GuardOperation;
  llama_guard?: GuardOperation;
  ask?: AskOperation;
  // TODO: other kinds of operation
  extract?: null;
}

interface BaseOperation {
  triggers?: TaskTrigger[];
}

export interface LabelOperation extends BaseOperation {
  labels?: {
    label: string;
    examples?: string[];
    description?: string;
  }[];
  ident?: string;
  multiple?: boolean;
  description?: string;
}

export interface GraphOperation extends BaseOperation {
  ident?: string;
  entity_defs?: EntityDefinition[];
  examples?: GraphExtractionExample[];
}

export interface EntityDefinition {
  label: string;
  description?: string;
}

export interface GraphExtractionExample {
  entities: EntityExample[];
  relations: RelationExample[];
  text: string;
}

export interface EntityExample {
  name: string;
  label: string;
}

export interface RelationExample {
  source: string;
  target: string;
  label: string;
}

export interface QAOperation extends BaseOperation {
  generate_answers_prompt?: string;
  question_generator_prompt?: string;
  summary_prompt?: string;
  system_question_generator_prompt?: string;
}

export interface AskOperation extends BaseOperation {
  question?: string;
  destination?: string;
  json?: boolean;
  user_prompt?: string;
}

export interface GuardOperation extends BaseOperation {
  enabled?: boolean;
}

export interface TaskTrigger {
  url?: string;
  headers?: { [key: string]: string };
  params?: { [key: string]: string };
}

/**
 * Configuration of the LLM used for the task
 */
export interface LLMConfig {
  model?: string;
  keys?: { [model: string]: any };
  prompts?: {
    [model: string]: { prompt: string; system?: string } | null;
  };
}

export type TaskParameters = DataAugmentationParameters | SemanticModelMigration;

/**
 * Parameters used to configure data augmentation tasks
 */
export interface DataAugmentationParameters {
  name: string;
  filter: {
    contains?: string[];
    contains_operator?: 0 | 1;
    resource_type?: string[];
    field_types?: string[];
    labels?: string[];
    labels_operator?: 0 | 1;
    not_field_types?: string[];
    apply_to_agent_generated_fields?: boolean;
  };
  llm: LLMConfig;
  on?: TaskApplyTo;
  operations?: Operation[];
}

export interface SemanticModelMigration {
  semantic_model_id: string;
  hf_embedding_key?: any;
}

export interface TaskStatus {
  task: TaskDefinition;
  source: string;
  kbid: string;
  dataset_id?: string;
  account_id: string;
  nua_client_id?: string;
  user_id: string;
  id: string;
  parameters: TaskParameters;
  timestamp: string;
  stopped: boolean;
  stopped_at: string;
  failed: boolean;
  retries: number;
}

/**
 * Task running as a batch on all the resources existing on the moment the task is launched.
 * Once the task is completed, it stops.
 */
export interface TaskOnBatch extends TaskStatus {
  scheduled: boolean;
  completed: boolean;
  scheduled_at: string;
  completed_at: string;
  cleanup_parent_task_id?: string;
}

/**
 * Task configured to run on new resources.
 * The task never ends unless the user stops it.
 */
export interface TaskOnGoing extends TaskStatus {
  defined_at: string;
  enabled: boolean;
}

/**
 * TaskListResponse provides:
 * - **tasks**: list of all the available task and their schema
 * - **running**: list of tasks running on existing resources
 * - **configs**: list of tasks running on new resources
 * - **done**: list of finished tasks which were running on existing resources
 */
export interface TaskListResponse {
  tasks: TaskFullDefinition[];
  running: TaskOnBatch[];
  configs: TaskOnGoing[];
  done: TaskOnBatch[];
}

/**
 * Response from start and stop endpoints.
 */
export interface StartStopTaskResponse {
  task: string;
  status: string;
  id: string;
}

/**
 * Response from inspect endpoint.
 */
export interface InspectTaskResponse {
  request?: TaskOnBatch;
  config?: TaskOnGoing;
}
