import { Directive, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditResourceService } from '../edit-resource.service';
import { filter, map, Observable, Subject, switchMap } from 'rxjs';
import { FieldId, Resource } from '@nuclia/core';
import { takeUntil } from 'rxjs/operators';

@Directive({
  selector: '[appSelectFirstField]',
})
export class SelectFirstFieldDirective implements OnDestroy {
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  editResource: EditResourceService = inject(EditResourceService);

  unsubscribeAll = new Subject<void>();

  protected resource: Observable<Resource> = this.editResource.resource.pipe(
    filter((resource) => !!resource),
    map((resource) => resource as Resource),
  );
  protected fieldId: Observable<FieldId> = this.route.params.pipe(
    filter((params) => !!params['fieldType'] && !!params['fieldId']),
    map((params) => {
      const field: FieldId = { field_id: params['fieldId'], field_type: params['fieldType'] };
      this.editResource.setCurrentField(field);
      return field;
    }),
  );

  constructor() {
    this.route.params
      .pipe(
        filter((params) => !params['fieldId'] && !params['fieldType']),
        switchMap(() => this.editResource.fields),
        filter((fields) => fields.length > 0),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((fields) => {
        const field = fields[0];
        this.router.navigate([`./${field.field_type}/${field.field_id}`], { relativeTo: this.route });
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
