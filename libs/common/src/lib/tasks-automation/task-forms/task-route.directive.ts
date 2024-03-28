import { Directive, inject } from '@angular/core';
import { filter, map } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Directive({
  selector: '[stfTaskRoute]',
  standalone: true,
})
export class TaskRouteDirective {
  protected activeRoute = inject(ActivatedRoute);

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );
}
