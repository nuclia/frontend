import { TaskName, TaskOnBatch, TaskOnGoing, TaskParameters } from '@nuclia/core';

export interface TaskConfiguration {
  filters: { label: string; count?: number }[];
  hasPrompt?: boolean;
  fieldName?: string;
  labelSets?: string;
  nerFamily?: string;
}

export interface BaseTask extends TaskConfiguration {
  id: string;
  taskName: TaskName;
  count?: { total: number; processed: number };
  creationDate: string;
  type: 'automated' | 'one-time';
}

export interface AutomatedTask extends BaseTask {
  running: boolean;
  type: 'automated';
}

export interface OneTimeTask extends BaseTask {
  status: 'completed' | 'progress' | 'stopped' | 'error';
  type: 'one-time';
}

export function mapBatchToOneTimeTask(task: TaskOnBatch): OneTimeTask {
  return {
    id: task.id,
    taskName: task.task.name,
    type: 'one-time',
    status: task.completed ? 'completed' : task.failed ? 'error' : task.stopped ? 'stopped' : 'progress',
    creationDate: task.scheduled_at,
    ...mapParameters(task.parameters),
  };
}

export function mapOnGoingToAutomatedTask(task: TaskOnGoing): AutomatedTask {
  return {
    id: task.id,
    taskName: task.task.name,
    type: 'automated',
    running: !task.stopped,
    creationDate: task.defined_at,
    ...mapParameters(task.parameters),
  };
}

function mapParameters(parameters: TaskParameters): TaskConfiguration {
  return {
    filters: [
      { label: 'contains', count: parameters.filter.contains.length },
      { label: 'resource_type', count: parameters.filter.resource_type.length },
    ],
    hasPrompt: false, // TODO: extract prompt from parameters
    labelSets: (parameters.operations || [])
      .map((operation) => operation.label?.ident)
      .filter((l) => !!l)
      .join(', '),
  };
}
