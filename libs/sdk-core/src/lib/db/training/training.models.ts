export enum TrainingType {
  classifier = 'classifier',
  resource_labeler = 'resource_labeler',
  paragraph_labeler = 'paragraph_labeler',
  ner = 'ner',
}

export enum TrainingStatus {
  finished = 'finished',
  not_running = 'not_running',
  running = 'running',
  started = 'started',
  stopped = 'stopped',
}

export interface TrainingExecution {
  start: string;
  end: string;
  result: string;
}

export interface TrainingTask {
  task: string;
  status: TrainingStatus;
  last_execution?: TrainingExecution;
}
