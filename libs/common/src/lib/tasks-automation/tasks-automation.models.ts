import { TaskName, TaskOnBatch, TaskOnGoing, TaskParameters } from '@nuclia/core';

export interface TaskConfiguration {
  filters: { label: string; count?: number }[];
  hasPrompt?: boolean;
  fieldName?: string;
  labelSet?: string;
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
  status: 'completed' | 'progress' | 'error';
  type: 'one-time';
}

export function mapBatchToOneTimeTask(task: TaskOnBatch): OneTimeTask {
  return {
    id: task.id,
    taskName: task.task.name,
    type: 'one-time',
    status: task.completed ? 'completed' : task.failed ? 'error' : 'progress',
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
    filters: [], // TODO: extract filters from parameters
    hasPrompt: false, // TODO: extract prompt from parameters
    labelSet: '', // TODO extract label set from parameters
  };
}
