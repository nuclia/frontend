export enum TrainingType {
  classifier = 'classifier',
  labeller = 'labeller',
}

export interface TrainingTask {
  id: string;
  status: string;
}
