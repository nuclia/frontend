import { inject, Injectable } from '@angular/core';
import { SDKService } from '@flaps/core';
import { BehaviorSubject, map, Observable, switchMap, take } from 'rxjs';
import {
  AutomatedTask,
  mapBatchToOneTimeTask,
  mapOnGoingToAutomatedTask,
  OneTimeTask,
} from './tasks-automation.models';
import { TaskListResponse } from '@nuclia/core';

@Injectable({
  providedIn: 'root',
})
export class TasksAutomationService {
  private sdk = inject(SDKService);

  private _currentKb = this.sdk.currentKb;
  private _taskList = new BehaviorSubject<(AutomatedTask | OneTimeTask)[]>([]);

  textBlocksLabelerTasks: Observable<(AutomatedTask | OneTimeTask)[]> = this._taskList.pipe(
    map((taskList) => taskList.filter((task) => task.taskName === 'text-blocs-labeler')),
  );

  initTaskList() {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) => kb.taskManager.getTasks()),
        map((response: TaskListResponse) => this.mapTaskList(response)),
      )
      .subscribe((taskList) => this._taskList.next(taskList));
  }

  stopTask(taskId: string) {
    this._currentKb
      .pipe(
        take(1),
        switchMap((kb) =>
          kb.taskManager.stopTask(taskId).pipe(
            switchMap((response) => {
              console.log(response);
              return kb.taskManager.getTasks();
            }),
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
}
