import type { WritableKnowledgeBox } from '../kb';
import type { INuclia } from '../../models';
import { Observable } from 'rxjs';
import { ApplyOption, InspectTaskResponse, StartStopTaskResponse, TaskListResponse, TaskName, TaskParameters } from './task.models';

export class TaskManager {
  kb: WritableKnowledgeBox;
  nuclia: INuclia;

  constructor(kb: WritableKnowledgeBox, nuclia: INuclia) {
    this.kb = kb;
    this.nuclia = nuclia;
  }

  /**
   * List the available tasks on a KB and get the list of tasks running and done.
   *
   * @param count How many finished task to return. By default, the server is returning 10.
   */
  getTasks(count?: number): Observable<TaskListResponse> {
    return this.nuclia.rest.get<TaskListResponse>(
      `${this.kb.path}/tasks${typeof count === 'number' ? '?count=' + count : ''}`,
    );
  }

  /**
   * Delete a task so it is not listed anymore in getTasks.
   * If the task is currently running, you should stop it before deleting it.
   * @param taskId
   */
  deleteTask(taskId: string): Observable<void> {
    return this.nuclia.rest.delete(`${this.kb.path}/task/${taskId}`);
  }

  /**
   * Start a new task
   * @param name Name of the task
   * @param parameters Parameters configuring the task
   * @param apply Apply the task to:
   *  - EXISTING: only the resources already existing in the KB.
   *  - NEW: only the resources created in the KB after the task is started
   *  - ALL: all the existing and new resources of the KB
   */
  startTask(
    name: TaskName,
    parameters: TaskParameters,
    apply: ApplyOption = 'EXISTING',
  ): Observable<StartStopTaskResponse> {
    return this.nuclia.rest.post(`${this.kb.path}/task/start`, { name, parameters, apply });
  }

  /**
   * Stop a running task.
   * @param taskId
   */
  stopTask(taskId: string): Observable<StartStopTaskResponse> {
    return this.nuclia.rest.post(`${this.kb.path}/task/${taskId}/stop`, {});
  }

  /**
   * Restart a running task.
   * @param taskId
   */
  restartTask(taskId: string): Observable<StartStopTaskResponse> {
    return this.nuclia.rest.post(`${this.kb.path}/task/${taskId}/restart`, {});
  }

  /**
   * Get the status of a tasks
   *
   * @param taskId
   */
    getTask(taskId: string): Observable<InspectTaskResponse> {
      return this.nuclia.rest.get<InspectTaskResponse>(
        `${this.kb.path}/task/${taskId}/inspect`,
      );
    }
}
