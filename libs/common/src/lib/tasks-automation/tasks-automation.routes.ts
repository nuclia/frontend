import { Routes } from '@angular/router';
import { AskComponent, GraphExtractionComponent, LabelerComponent, QuestionAnswerComponent } from './task-forms';
import { TasksAutomationComponent } from './tasks-automation.component';
import { TaskListComponent } from './task-list';
import { ContentSafetyComponent } from './task-forms/content-safety/content-safety.component';
import { LLMSecurityComponent } from './task-forms/llm-security/llm-security.component';
import { TaskDetailsComponent } from './task-details/task-details.component';

export const TASK_AUTOMATION_ROUTES: Routes = [
  {
    path: '',
    component: TasksAutomationComponent,
    children: [
      {
        path: '',
        component: TaskListComponent,
      },
      { path: 'ask', component: AskComponent },
      { path: 'ask/:taskId', component: AskComponent },

      { path: 'synthetic-questions', component: QuestionAnswerComponent },
      { path: 'synthetic-questions/:taskId', component: QuestionAnswerComponent },

      { path: 'labeler', component: LabelerComponent },
      { path: 'labeler/:taskId', component: LabelerComponent },

      { path: 'llm-graph', component: GraphExtractionComponent },
      { path: 'llm-graph/:taskId', component: GraphExtractionComponent },

      { path: 'prompt-guard', component: LLMSecurityComponent },
      { path: 'prompt-guard/:taskId', component: LLMSecurityComponent },

      { path: 'llama-guard', component: ContentSafetyComponent },
      { path: 'llama-guard/:taskId', component: ContentSafetyComponent },
      {
        path: ':taskId',
        component: TaskDetailsComponent,
      },
    ],
  },
];
