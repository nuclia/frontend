import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, map, Observable, switchMap, take } from 'rxjs';
import {
  AutomatedTask,
  mapBatchToOneTimeTask,
  mapOnGoingToAutomatedTask,
  OneTimeTask,
  resolveSchemaReferences,
} from './tasks-automation.models';
import { ApplyOption, TaskFullDefinition, TaskListResponse, TaskName } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class TasksAutomationService {
  private sdk = inject(SDKService);

  private _currentKb = this.sdk.currentKb;
  private _taskList = new BehaviorSubject<(AutomatedTask | OneTimeTask)[]>([]);
  private _taskDefinitions = new BehaviorSubject<TaskFullDefinition[]>([]);

  textBlocksLabelerTasks: Observable<(AutomatedTask | OneTimeTask)[]> = this._taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'text-blocs-labeler')),
  );
  resourceLabelerTasks: Observable<(AutomatedTask | OneTimeTask)[]> = this._taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'resource-labeler')),
  );
  taskDefinitions = this._taskDefinitions.asObservable();

  initTaskList() {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.taskManager.getTasks()),
      )
      .subscribe((taskList) => {
        this._taskList.next(this.mapTaskList(taskList));
        this._taskDefinitions.next(this.resolveReferences(taskList.tasks));
      });
  }

  startTask(taskName: TaskName, parameters: any, apply: ApplyOption) {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.taskManager.startTask(taskName, parameters, apply).pipe(
            switchMap((response) => kb.taskManager.getTasks()),
            map((response: TaskListResponse) => this.mapTaskList(response)),
          ),
        ),
      )
      .subscribe((taskList) => this._taskList.next(taskList));
  }

  stopTask(taskId: string) {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.taskManager.stopTask(taskId).pipe(
            switchMap((response) => kb.taskManager.getTasks()),
            map((response: TaskListResponse) => this.mapTaskList(response)),
          ),
        ),
      )
      .subscribe((taskList) => this._taskList.next(taskList));
  }

  deleteTask(taskId: string) {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.taskManager.deleteTask(taskId).pipe(
            switchMap((response) => kb.taskManager.getTasks()),
            map((response: TaskListResponse) => this.mapTaskList(response)),
          ),
        ),
      )
      .subscribe((taskList) => this._taskList.next(taskList));
  }

  restartTask(taskId: string) {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.taskManager.restartTask(taskId).pipe(
            switchMap((response) => kb.taskManager.getTasks()),
            map((response: TaskListResponse) => this.mapTaskList(response)),
          ),
        ),
      )
      .subscribe((taskList) => this._taskList.next(taskList));
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
