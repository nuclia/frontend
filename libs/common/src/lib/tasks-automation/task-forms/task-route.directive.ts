import { Directive, inject } from '@angular/core';
import { filter, map, switchMap, take } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';

@Directive({
  selector: '[stfTaskRoute]',
  standalone: true,
})
export class TaskRouteDirective {
  protected activeRoute = inject(ActivatedRoute);
  protected router = inject(Router);

  taskId = this.activeRoute.params.pipe(
    filter((params) => !!params['taskId']),
    map((params) => params['taskId'] as string),
  );
  backRoute = this.activeRoute.params.pipe(map((params) => (!params['taskId'] ? '..' : '../..')));

  errorMessages = {
    required: 'validation.required',
  };

  backToTaskList() {
    this.backRoute
      .pipe(
        take(1),
        switchMap((backRoute) => this.router.navigate([backRoute], { relativeTo: this.activeRoute })),
      )
      .subscribe();
  }
}
