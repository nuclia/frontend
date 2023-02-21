import { catchError, map, Observable, of } from 'rxjs';
import type { INuclia } from '../../models';
import type { WritableKnowledgeBox } from '../kb';
import { TrainingExecutions, TrainingStatus, TrainingTask, TrainingType } from './training.models';

export class Training {
  kb: WritableKnowledgeBox;
  nuclia: INuclia;

  constructor(kb: WritableKnowledgeBox, nuclia: INuclia) {
    this.kb = kb;
    this.nuclia = nuclia;
  }

  start(
    type: TrainingType,
    params?: { valid_nertags?: string[]; valid_labelsets?: string[] },
  ): Observable<TrainingTask> {
    return this.nuclia.rest.post<TrainingTask>(`${this.kb.path}/train/${type}/start`, params || {});
  }

  stop(type: TrainingType): Observable<TrainingTask> {
    return this.nuclia.rest.post<TrainingTask>(`${this.kb.path}/train/${type}/stop`, {});
  }

  getStatus(type: TrainingType): Observable<TrainingTask> {
    return this.nuclia.rest
      .get<TrainingTask>(`${this.kb.path}/train/${type}/inspect`)
      .pipe(catchError(() => of({ task: '', status: TrainingStatus.not_running } as TrainingTask)));
  }

  getExecutions(page = 0): Observable<TrainingExecutions> {
    return this.nuclia.rest.get<TrainingExecutions>(`${this.kb.path}/train/executions?page=${page}`);
  }

  hasModel(type: TrainingType): Observable<boolean> {
    return this.nuclia.rest.get(`${this.kb.path}/train/${type}/model/model/nuclia.json`).pipe(
      map(() => true),
      catchError(() => of(false)),
    );
  }
}
