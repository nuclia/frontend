import { isObject } from '@flaps/core';
import { TaskName, TaskOnBatch, TaskOnGoing, TaskParameters } from '@nuclia/core';

export interface TaskConfiguration {
  title: string;
  filters: { label: string; count?: number }[];
  hasPrompt?: boolean;
  fieldName?: string;
  labelSets?: string;
  nerFamily?: string;
}

export interface BaseTask extends TaskConfiguration {
  id: string;
  taskName: TaskName;
  creationDate: string;
  type: 'automated' | 'one-time';
}

export interface AutomatedTask extends BaseTask {
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
    creationDate: task.scheduled_at ? `${task.scheduled_at}+00:00` : '',
    ...mapParameters(task.parameters),
  };
}

export function mapOnGoingToAutomatedTask(task: TaskOnGoing): AutomatedTask {
  return {
    id: task.id,
    taskName: task.task.name,
    type: 'automated',
    creationDate: task.defined_at ? `${task.defined_at}+00:00` : '',
    ...mapParameters(task.parameters),
  };
}

function mapParameters(parameters: TaskParameters): TaskConfiguration {
  return {
    title: parameters.name,
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
