import { Routes } from '@angular/router';
import { WidgetsComponent } from './widgets.component';
import { WidgetListComponent } from './widget-list.component';
import { WidgetFormComponent } from './widget-form/widget-form.component';

export const WIDGETS_ROUTES: Routes = [
  {
    path: '',
    component: WidgetsComponent,
    children: [
      {
        path: '',
        component: WidgetListComponent,
      },
      {
        path: ':slug',
        component: WidgetFormComponent,
      },
    ],
  },
];
