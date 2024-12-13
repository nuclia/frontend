export type TaskName = 'labeler' | 'llm-graph' | 'synthetic-questions' | 'ask' | 'llama-guard' | 'prompt-guard';
export type ApplyOption = 'ALL' | 'EXISTING' | 'NEW';

/**
 * Minimum definition of a task.
 */
export interface TaskDefinition {
  name: TaskName;
  data_augmentation: boolean;
  description?: string;
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
  prompt_guard?: { enabled: boolean };
  llama_guard?: { enabled: boolean };
  ask?: AskOperation;
  // TODO: other kinds of operation
  extract?: null;
}

export interface LabelOperation {
  labels: {
    label: string;
    examples?: string[];
    description?: string;
  }[];
  ident?: string;
  description?: string;
}

export interface GraphOperation {
  ident?: string;
  entity_defs?: EntityDefinition[];
  entity_examples?: EntityExample[];
  relation_examples?: RelationExample[];
}

export interface EntityDefinition {
  label: string;
  description?: string;
}

export interface EntityExample {
  name: string;
  label: string;
  example?: string;
}

export interface RelationExample {
  source: string;
  target: string;
  label: string;
  example?: string;
}

export interface QAOperation {
  generate_answers_prompt?: string;
  question_generator_prompt?: string;
  summary_prompt?: string;
  system_question_generator_prompt?: string;
}

export interface AskOperation {
  question?: string;
  destination?: string;
  json?: boolean;
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

/**
 * Parameters used to configure tasks
 */
export interface TaskParameters {
  name: string;
  filter: {
    contains?: string[];
    resource_type?: string[];
    field_types?: string[];
  };
  llm: LLMConfig;
  on?: TaskApplyTo;
  operations?: Operation[];
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
}

/**
 * Task configured to run on new resources.
 * The task never ends unless the user stops it.
 */
export interface TaskOnGoing extends TaskStatus {
  defined_at: string;
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
