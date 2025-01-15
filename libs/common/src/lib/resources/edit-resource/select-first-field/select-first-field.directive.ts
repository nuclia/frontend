import { Directive, inject, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EditResourceService } from '../edit-resource.service';
import { combineLatest, filter, map, Observable, of, ReplaySubject, Subject, switchMap } from 'rxjs';
import { FIELD_TYPE, FieldId, Resource, ResourceField } from '@nuclia/core';
import { takeUntil } from 'rxjs/operators';
import { ResourceNavigationService } from '../resource-navigation.service';

@Directive({
  selector: '[appSelectFirstField]',
  standalone: false,
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
  private _noField = new ReplaySubject<boolean>(1);
  protected noField: Observable<boolean> = this._noField.asObservable();

  constructor() {
    this.route.params
      .pipe(
        filter((params) => !params['fieldId'] && !params['fieldType']),
        switchMap(() => combineLatest([this.editResource.resource, this.route.parent?.params || of({ id: '' })])),
        // Make sure the resource stored in editResource service is matching the one from the current path
        filter(([resource, params]) => resource?.id === params['id']),
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
            return a.field_id.startsWith('da-') ? 1 : b.field_id.startsWith('da-') ? -1 : 0;
          }
        });
        const field: ResourceField = notGenericFields[0];
        if (field) {
          this.router.navigate([`./${field.field_type}/${field.field_id}`], {
            relativeTo: this.route,
            replaceUrl: true,
          });
        } else {
          this._noField.next(true);
        }
      });
    this.navigationService.currentRoute = this.route;
  }

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
