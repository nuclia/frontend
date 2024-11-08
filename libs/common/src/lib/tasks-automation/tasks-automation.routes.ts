import { Routes } from '@angular/router';
import { AskComponent, LabelNersComponent, LabelerComponent, QuestionAnswerComponent } from './task-forms';
import { TasksAutomationComponent } from './tasks-automation.component';
import { TaskListComponent } from './task-list';

export const TASK_AUTOMATION_ROUTES: Routes = [
  {
    path: '',
    component: TasksAutomationComponent,
    children: [
      {
        path: '',
        component: TaskListComponent,
      },
      {
        path: 'ask',
        component: AskComponent,
      },
      {
        path: 'ask/:taskId',
        component: AskComponent,
      },
      {
        path: 'question-answer',
        component: QuestionAnswerComponent,
      },
      {
        path: 'question-answer/:taskId',
        component: QuestionAnswerComponent,
      },
      {
        path: 'labeler',
        component: LabelerComponent,
      },
      {
        path: 'labeler/:taskId',
        component: LabelerComponent,
      },
      {
        path: 'label-ners',
        component: LabelNersComponent,
      },
      {
        path: 'label-ners/:taskId',
        component: LabelNersComponent,
      },
    ],
  },
];
