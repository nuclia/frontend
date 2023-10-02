import { Directive, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditResourceService } from '../edit-resource.service';
import { filter, map, Observable, Subject, switchMap } from 'rxjs';
import { FIELD_TYPE, FieldId, Resource, ResourceField } from '@nuclia/core';
import { takeUntil } from 'rxjs/operators';
import { ResourceNavigationService } from '../resource-navigation.service';

@Directive({
  selector: '[appSelectFirstField]',
})
export class SelectFirstFieldDirective implements OnDestroy {
  private navigationService = inject(ResourceNavigationService);
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
        // Take the oldest field
        const notGenericFields = fields.filter((field) => field.field_type !== FIELD_TYPE.generic);
        notGenericFields.sort((a, b) => {
          if (a.value && b.value && 'added' in a.value && 'added' in b.value) {
            return (a.value.added || '').localeCompare(b.value?.added || '');
          } else {
            return 0;
          }
        });
        const field: ResourceField = notGenericFields[0];
        this.router.navigate([`./${field.field_type}/${field.field_id}`], {
          relativeTo: this.route,
          replaceUrl: true,
        });
      });
    this.navigationService.currentRoute = this.route;
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
