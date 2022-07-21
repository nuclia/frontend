import type { Observable } from 'rxjs';
import type { INuclia } from '../models';
import type { WritableKnowledgeBox } from './kb';
import type { TrainingTask, TrainingType } from './training.models';

export class Training {
  kb: WritableKnowledgeBox;
  nuclia: INuclia;

  constructor(kb: WritableKnowledgeBox, nuclia: INuclia) {
    this.kb = kb;
    this.nuclia = nuclia;
  }

  start(type: TrainingType): Observable<TrainingTask> {
    return this.nuclia.rest.post<TrainingTask>(`${this.kb.path}/train/${type}/start`, {});
  }

  stop(type: TrainingType): Observable<TrainingTask> {
    return this.nuclia.rest.post<TrainingTask>(`${this.kb.path}/train/${type}/stop`, {});
  }

  getStatus(type: TrainingType): Observable<TrainingTask> {
    return this.nuclia.rest.get<TrainingTask>(`${this.kb.path}/train/${type}/inspect`);
  }
}
