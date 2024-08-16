export type TaskName = 'text-blocs-labeler' | 'resource-labeler';
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
    $defs: { [property: string]: unknown };
    properties: { [property: string]: unknown };
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
  label?: {
    labels: {
      label: string;
      examples: string[];
      description?: string;
    }[];
  };
  // TODO: other kinds of operation
  graph?: null;
  ask?: null;
  qa?: null;
  extract?: null;
}

/**
 * Configuration of the LLM used for the task
 */
export interface LLMConfig {
  model: string;
  keys?: { [model: string]: any };
  prompts?: {
    [model: string]: { prompt: string; system?: string } | null;
  };
}

/**
 * Parameters used to configure tasks
 */
export interface TaskParameters {
  filter: {
    contains: string[];
    resource_type: string[];
  };
  llm: LLMConfig;
  on?: TaskApplyTo;
  operation?: Operation[];
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
