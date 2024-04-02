import { Routes } from '@angular/router';
import {
  GlobalQuestionComponent,
  LabelNersComponent,
  LabelResourcesComponent,
  LabelTextBlocksComponent,
  QuestionAnswerComponent,
  SummarizeResourcesComponent,
} from './task-forms';
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
        path: 'global-question',
        component: GlobalQuestionComponent,
      },
      {
        path: 'global-question/:taskId',
        component: GlobalQuestionComponent,
      },
      {
        path: 'summarize-resources',
        component: SummarizeResourcesComponent,
      },
      {
        path: 'summarize-resources/:taskId',
        component: SummarizeResourcesComponent,
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
        path: 'label-resources',
        component: LabelResourcesComponent,
      },
      {
        path: 'label-resources/:taskId',
        component: LabelResourcesComponent,
      },
      {
        path: 'label-text-blocks',
        component: LabelTextBlocksComponent,
      },
      {
        path: 'label-text-blocks/:taskId',
        component: LabelTextBlocksComponent,
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
