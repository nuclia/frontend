import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FeaturesService, NavigationService, SDKService, UNAUTHORIZED_ICON } from '@flaps/core';
import { FIELD_TYPE, FieldId, Resource, ResourceField } from '@nuclia/core';
import { SisModalService } from '@nuclia/sistema';
import { combineLatest, filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { take, takeUntil } from 'rxjs/operators';
import { DATA_AUGMENTATION_ERROR, EditResourceView, getErrors } from './edit-resource.helpers';
import { EditResourceService } from './edit-resource.service';
import { ResourceNavigationService } from './resource-navigation.service';

interface ResourceFieldWithIcon extends ResourceField {
  icon: string;
  hasError?: boolean;
  title?: string;
}

@Component({
  templateUrl: 'edit-resource.component.html',
  styleUrls: ['edit-resource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: false,
})
export class EditResourceComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  isArag = combineLatest([this.route.data, this.features.unstable.retrievalAgents]).pipe(
    map(([data, isAragEnabled]) => isAragEnabled && data['mode'] === 'arag'),
    takeUntil(this.unsubscribeAll),
  );
  backRoute: Observable<string> = combineLatest([this.navigationService.homeUrl, this.isArag]).pipe(
    map(([homeUrl, isArag]) => (isArag ? `${homeUrl}/sessions` : `${homeUrl}/resources`)),
  );
  currentView: EditResourceView | null = null;
  currentField: Observable<FieldId | 'resource'> = this.editResource.currentField;
  resource: Observable<Resource | null> = this.editResource.resource;
  fields: Observable<ResourceFieldWithIcon[]> = combineLatest([
    this.editResource.resource,
    this.editResource.fields,
  ]).pipe(
    map(([resource, fields]) =>
      fields
        .filter((field) => field.field_type !== FIELD_TYPE.generic)
        .map((field) => ({
          ...field,
          icon:
            field.field_type === FIELD_TYPE.text
              ? 'file'
              : field.field_type === FIELD_TYPE.conversation
                ? 'chat'
                : field.field_type,
          hasError:
            !!resource &&
            getErrors(field, resource).filter((error) => error.code_str !== DATA_AUGMENTATION_ERROR).length > 0,
        })),
    ),
  );
  originalFields: Observable<ResourceFieldWithIcon[]> = this.fields.pipe(
    map((fields) => fields.filter((field) => !field.field_id.startsWith('da-'))),
  );
  generatedFields: Observable<ResourceFieldWithIcon[]> = this.fields.pipe(
    map((fields) =>
      fields
        .filter((field) => field.field_id.startsWith('da-'))
        .map((field) => ({ ...field, title: field.field_id.split('-')[1] })),
    ),
  );
  isAdminOrContrib = this.features.isKbAdminOrContrib;
  summarizationAuthorized = this.features.authorized.summarization;

  unauthorizedIcon = UNAUTHORIZED_ICON;

  activeField?: FieldId | 'resource';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editResource: EditResourceService,
    private navigationService: NavigationService,
    private cdr: ChangeDetectorRef,
    private modal: SisModalService,
    private features: FeaturesService,
    private sdk: SDKService,
    public resourceNavigationService: ResourceNavigationService,
  ) {
    combineLatest([this.route.params, this.isArag])
      .pipe(
        filter(([params]) => !!params['id']),
        switchMap(([params, isArag]) => {
          const resourceId = params['id'];
          this.resourceNavigationService.currentResourceId = resourceId;
          return isArag ? this.editResource.loadSession(resourceId) : this.editResource.loadResource(resourceId);
        }),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe();
  }

  ngOnInit() {
    this.editResource.currentView.pipe(takeUntil(this.unsubscribeAll)).subscribe((view) => {
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
    this.isArag
      .pipe(
        switchMap((isArag) => {
          const confirmData = isArag
            ? {
                title: 'retrieval-agents.sessions.list.confirm-deletion.title',
                description: 'retrieval-agents.sessions.list.confirm-deletion.description',
              }
            : {
                title: 'resource.confirm-delete.title',
                description: 'resource.confirm-delete.description',
              };
          return this.modal.openConfirm({
            ...confirmData,
            confirmLabel: 'generic.delete',
            isDestructive: true,
          }).onClose;
        }),
        filter((confirm) => !!confirm),
        switchMap(() => this.editResource.resource),
        take(1),
        map((resource) => resource as Resource),
        switchMap((resource: Resource) => resource.delete(true)),
      )
      .subscribe((route) => this.backToResources());
  }

  summarizeResource() {
    const avoidTabClosing = (event: BeforeUnloadEvent) => event.preventDefault();
    return this.modal
      .openConfirm({
        title: 'resource.confirm-summarize.title',
        description: 'resource.confirm-summarize.description',
      })
      .onClose.pipe(
        filter((confirm) => !!confirm),
        switchMap(() => this.editResource.resource),
        take(1),
        map((resource) => resource as Resource),
        tap(() => window.addEventListener('beforeunload', avoidTabClosing)),
        switchMap((resource) =>
          this.sdk.currentKb.pipe(
            switchMap((kb) => kb.summarize([resource.id])),
            switchMap((summary) => resource.modify({ summary })),
          ),
        ),
        tap(() => window.removeEventListener('beforeunload', avoidTabClosing)),
      )
      .subscribe();
  }

  backToResources() {
    this.backRoute
      .pipe(take(1))
      .subscribe((resourceRoute) => this.router.navigate([resourceRoute], { queryParams: { preserveFilters: true } }));
  }

  previousResource() {
    this.resourceNavigationService.goToPrevious();
  }
  nextResource() {
    this.resourceNavigationService.goToNext();
  }

  deleteField(field: FieldId) {
    this.editResource.confirmAndDelete(field.field_type, field.field_id).subscribe((success) => {
      if (success) {
        this.navigateToField('resource');
      }
    });
  }
}
