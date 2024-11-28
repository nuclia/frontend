import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { map, ReplaySubject, switchMap, take, tap } from 'rxjs';
import {
  AutomatedTask,
  mapBatchToOneTimeTask,
  mapOnGoingToAutomatedTask,
  OneTimeTask,
  resolveSchemaReferences,
} from './tasks-automation.models';
import { ApplyOption, TaskFullDefinition, TaskListResponse, TaskName, TaskParameters } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class TasksAutomationService {
  private sdk = inject(SDKService);

  private _currentKb = this.sdk.currentKb;
  private _tasksData = new ReplaySubject<TaskListResponse>(1);
  taskList = this._tasksData.pipe(map((data) => this.mapTaskList(data)));
  taskDefinitions = this._tasksData.pipe(map((data) => this.resolveReferences(data.tasks)));

  initTaskList() {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.taskManager.getTasks()),
      )
      .subscribe((taskList) => {
        this._tasksData.next(taskList);
      });
  }

  startTask(taskName: TaskName, parameters: TaskParameters, apply: ApplyOption) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) =>
        kb.taskManager.startTask(taskName, parameters, apply).pipe(switchMap(() => kb.taskManager.getTasks())),
      ),
      tap((response) => this._tasksData.next(response)),
    );
  }

  stopTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.stopTask(taskId).pipe(switchMap(() => kb.taskManager.getTasks()))),
      tap((response) => this._tasksData.next(response)),
    );
  }

  deleteTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.deleteTask(taskId).pipe(switchMap(() => kb.taskManager.getTasks()))),
      tap((response) => this._tasksData.next(response)),
    );
  }

  restartTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.restartTask(taskId).pipe(switchMap(() => kb.taskManager.getTasks()))),
      tap((response) => this._tasksData.next(response)),
    );
  }

  getTask(taskId: string) {
    return this._currentKb.pipe(
      take(1),
      switchMap((kb) => kb.taskManager.getTask(taskId)),
    );
  }

  private mapTaskList(response: TaskListResponse) {
    const taskList: (AutomatedTask | OneTimeTask)[] = [];

    response.running.forEach((task) => taskList.push(mapBatchToOneTimeTask(task)));
    response.done.forEach((task) => taskList.push(mapBatchToOneTimeTask(task)));
    response.configs.forEach((task) => taskList.push(mapOnGoingToAutomatedTask(task)));

    return taskList;
  }

  private resolveReferences(tasks: TaskFullDefinition[]) {
    return tasks.map((task) => {
      return {
        ...task,
        validation: {
          ...task.validation,
          properties: resolveSchemaReferences(task.validation.properties, task.validation.$defs),
        },
      };
    });
  }
}
