export enum TrainingType {
  classifier = 'classifier',
  labeller = 'labeller',
}

export enum TrainingStatus {
  finished = 'finished',
  not_running = 'not_running',
  running = 'running',
}

export interface TrainingTask {
  id: string;
  status: TrainingStatus;
}
