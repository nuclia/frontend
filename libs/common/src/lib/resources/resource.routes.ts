import { Routes } from '@angular/router';
import {
  AddFieldComponent,
  EditResourceComponent,
  ParagraphAnnotationComponent,
  ParagraphClassificationComponent,
  PreviewComponent,
  ResourceClassificationComponent,
  ResourceFileComponent,
  ResourceLinkComponent,
  ResourceProfileComponent,
  ResourceTextComponent,
} from './edit-resource';
import { MemoryComponent } from './memory/memory.component';
import { ResourceListComponent } from './resource-list';
import { ResourcesComponent } from './resources.component';

export const RESOURCE_ROUTES: Routes = [
  {
    path: '',
    component: ResourcesComponent,
    children: [
      {
        path: '',
        redirectTo: 'all',
        pathMatch: 'full',
      },
      {
        path: ':status',
        component: ResourceListComponent,
      },
      {
        path: ':id/edit',
        component: EditResourceComponent,
        children: [
          {
            path: '',
            redirectTo: 'resource',
            pathMatch: 'full',
          },
          {
            path: 'resource',
            component: ResourceProfileComponent,
          },
          {
            path: 'classification',
            component: ResourceClassificationComponent,
          },
          {
            path: 'classification/:fieldType',
            component: ResourceClassificationComponent,
          },
          {
            path: 'classification/:fieldType/:fieldId',
            component: ParagraphClassificationComponent,
          },
          {
            path: 'annotation',
            component: ParagraphAnnotationComponent,
          },
          {
            path: 'annotation/:fieldType/:fieldId',
            component: ParagraphAnnotationComponent,
          },
          {
            path: 'add-field',
            component: AddFieldComponent,
          },
          {
            path: 'text/:fieldId',
            component: ResourceTextComponent,
          },
          {
            path: 'link/:fieldId',
            component: ResourceLinkComponent,
          },
          {
            path: 'file/:fieldId',
            component: ResourceFileComponent,
          },
          {
            path: 'preview',
            component: PreviewComponent,
          },
          {
            path: 'preview/:fieldType/:fieldId',
            component: PreviewComponent,
          },
          {
            path: 'memory',
            component: MemoryComponent,
          },
        ],
      },
    ],
  },
];
