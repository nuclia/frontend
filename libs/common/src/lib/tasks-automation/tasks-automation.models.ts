import { isObject } from '@flaps/core';
import { DataAugmentationParameters, TaskFilterType, TaskName, TaskOnBatch, TaskOnGoing } from '@nuclia/core';

export interface DataAugmentationTaskOnGoing extends TaskOnGoing {
  parameters: DataAugmentationParameters;
}

export interface DataAugmentationTaskOnBatch extends TaskOnBatch {
  parameters: DataAugmentationParameters;
}

export const TASK_ICONS: { [key in TaskName]?: string } = {
  labeler: 'labeler',
  ask: 'generator',
  'llm-graph': 'graph',
  'synthetic-questions': 'question-answer',
  'prompt-guard': 'unlock',
  'llama-guard': 'shield-check',
};

export interface BaseTask {
  id: string;
  title: string;
  taskName: TaskName;
  creationDate: string;
  type: 'automated' | 'one-time';
  canClean: boolean;
}

export interface AutomatedTask extends BaseTask {
  type: 'automated';
}

export interface OneTimeTask extends BaseTask {
  status: 'completed' | 'progress' | 'stopped' | 'error';
  type: 'one-time';
}

export function mapBatchToOneTimeTask(task: DataAugmentationTaskOnBatch): OneTimeTask {
  return {
    type: 'one-time',
    status: task.completed ? 'completed' : task.failed ? 'error' : task.stopped ? 'stopped' : 'progress',
    ...getBaseTask(task),
  };
}

export function mapOnGoingToAutomatedTask(task: DataAugmentationTaskOnGoing): AutomatedTask {
  return {
    type: 'automated',
    ...getBaseTask(task),
  };
}

function getBaseTask(task: DataAugmentationTaskOnGoing | DataAugmentationTaskOnBatch) {
  return {
    id: task.id,
    title: task.parameters.name || '',
    taskName: task.task.name,
    creationDate: `${task.timestamp}+00:00`,
    canClean: !!task.task.can_cleanup,
  };
}

export function resolveSchemaReferences(schema: { [key: string]: any }, defs: { [key: string]: any }): any {
  return Object.entries(schema).reduce(
    (acc, [key, value]) => {
      if (key === '$ref') {
        const id = (value as string).split('#/$defs/')[1];
        acc = { ...acc, ...resolveSchemaReferences(defs[id] || {}, defs) };
      } else if (Array.isArray(value)) {
        acc[key] = value.map((item) => (isObject(item) ? resolveSchemaReferences(item, defs) : item));
      } else if (isObject(value)) {
        acc[key] = resolveSchemaReferences(value, defs);
      } else {
        acc[key] = value;
      }
      return acc;
    },
    {} as { [key: string]: any },
  );
}

export function getTaskFilterTypeFromTaskName(name: TaskName): TaskFilterType | null {
  switch (name) {
    case 'labeler':
      return 'label';
    case 'synthetic-questions':
      return 'qa';
    case 'llm-graph':
      return 'graph';
    case 'llama-guard':
      return 'llama_guard';
    case 'prompt-guard':
      return 'prompt_guard'
    case 'ask':
      return 'ask'
    default:
      return null;
  }
}
