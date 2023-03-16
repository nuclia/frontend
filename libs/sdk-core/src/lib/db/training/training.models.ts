export enum TrainingType {
  classifier = 'classifier',
  resource_labeler = 'resource-labeler',
  paragraph_labeler = 'paragraph-labeler',
  ner = 'ner',
}

export enum TrainingStatus {
  finished = 'finished',
  not_running = 'not_running',
  running = 'running',
  started = 'started',
  stopped = 'stopped',
}

export enum TrainingExecutionStatus {
  succeeded = 'succeeded',
  failed = 'failed',
  stopped = 'stopped',
}

export interface TrainingLastExecution {
  start: string;
  end: string;
  status: TrainingExecutionStatus;
}

export interface TrainingTask {
  task: string;
  status: TrainingStatus;
  last_execution?: TrainingLastExecution;
}

export interface TrainingExecutions {
  items: TrainingExecution[];
  pagination: {
    page: number;
    size: number;
    last: boolean;
  };
}

export interface TrainingExecution {
  id: string;
  task: string;
  start: string;
  end: string;
  status: TrainingExecutionStatus;
}

export interface TrainingExecutionWithDuration extends TrainingExecution {
  duration: string;
}
