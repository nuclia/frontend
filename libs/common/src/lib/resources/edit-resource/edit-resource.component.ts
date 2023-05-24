import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, Subject, switchMap } from 'rxjs';
import { FIELD_TYPE, FieldId, Resource, ResourceField } from '@nuclia/core';
import { EditResourceService } from './edit-resource.service';
import { takeUntil } from 'rxjs/operators';
import { EditResourceView } from './edit-resource.helpers';
import { NavigationService } from '../../services/navigation.service';
import { SisModalService } from '@nuclia/sistema';

interface ResourceFieldWithIcon extends ResourceField {
  icon: string;
  hasError?: boolean;
}

@Component({
  templateUrl: 'edit-resource.component.html',
  styleUrls: ['edit-resource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditResourceComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  backRoute: Observable<string> = this.navigationService.homeUrl.pipe(map((homeUrl) => `${homeUrl}/resources`));
  currentView: EditResourceView | null = null;
  currentField: Observable<FieldId | 'resource'> = this.editResource.currentField;
  resource: Observable<Resource | null> = this.editResource.resource;
  fields: Observable<ResourceFieldWithIcon[]> = this.editResource.fields.pipe(
    map((fields) =>
      fields
        .filter((field) => field.field_type !== FIELD_TYPE.generic)
        .map((field) => ({
          ...field,
          icon: field.field_type === FIELD_TYPE.text ? 'file' : field.field_type,
          hasError: !!field.error,
        })),
    ),
  );

  activeField?: FieldId | 'resource';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editResource: EditResourceService,
    private navigationService: NavigationService,
    private element: ElementRef,
    private cdr: ChangeDetectorRef,
    private modal: SisModalService,
  ) {
    this.route.params
      .pipe(
        filter((params) => !!params['id']),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((params) => this.editResource.loadResource(params['id']));
  }

  ngOnInit() {
    this.editResource.currentView.subscribe((view) => {
      this.currentView = view;
      this.cdr.detectChanges();
    });
    this.currentField.pipe(takeUntil(this.unsubscribeAll)).subscribe((current) => {
      this.activeField = current;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.editResource.reset();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  navigateToField(field: FieldId | 'resource') {
    this.editResource.setCurrentField(field);
    let path;
    if (this.currentView === 'resource') {
      path = field === 'resource' ? `./${field}` : `./${field.field_type}/${field.field_id}`;
    } else if (this.currentView === 'classification') {
      path =
        field === 'resource'
          ? `./${this.currentView}/${field}`
          : `./${this.currentView}/${field.field_type}/${field.field_id}`;
    } else {
      path =
        field === 'resource' ? `./${this.currentView}` : `./${this.currentView}/${field.field_type}/${field.field_id}`;
    }
    if (path) {
      this.router.navigate([path], { relativeTo: this.route });
    }
  }

  onViewChange() {
    this.editResource.setCurrentField('resource');
  }

  reprocessResource() {
    this.modal
      .openConfirm({
        title: 'resource.confirm-reprocess.title',
        description: 'resource.confirm-reprocess.description',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.editResource.resource),
        map((resource) => resource as Resource),
        switchMap((resource: Resource) => resource.reprocess()),
      )
      .subscribe();
  }

  deleteResource() {
    this.modal
      .openConfirm({
        title: 'resource.confirm-delete.title',
        description: 'resource.confirm-delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.editResource.resource),
        map((resource) => resource as Resource),
        switchMap((resource: Resource) => resource.delete(true)),
        switchMap(() => this.backRoute),
      )
      .subscribe((route) => this.router.navigate([route]));
  }
}
