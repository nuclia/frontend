import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  OnDestroy,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, Subject, switchMap, tap } from 'rxjs';
import { FIELD_TYPE, FieldId, Resource, ResourceField } from '@nuclia/core';
import { EditResourceService } from './edit-resource.service';
import { take, takeUntil } from 'rxjs/operators';
import { EditResourceView } from './edit-resource.helpers';
import { SisModalService } from '@nuclia/sistema';
import { FeaturesService, NavigationService, SDKService, UNAUTHORIZED_ICON } from '@flaps/core';
import { ResourceNavigationService } from './resource-navigation.service';

const PAWLS_KEY = 'pawls';

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
          icon:
            field.field_type === FIELD_TYPE.text
              ? 'file'
              : field.field_type === FIELD_TYPE.conversation
                ? 'chat'
                : field.field_type,
          hasError: !!field.error,
        })),
    ),
  );
  isPdfAnnotationEnabled = this.features.unstable['pdfAnnotation'];
  isAdminOrContrib = this.features.isKbAdminOrContrib;
  summarizationAuthorized = this.features.authorized['summarization'];

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
    this.route.params
      .pipe(
        filter((params) => !!params['id']),
        switchMap((params) => {
          const resourceId = params['id'];
          this.resourceNavigationService.currentResourceId = resourceId;
          return this.editResource.loadResource(resourceId);
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

  goToPawls() {
    this.editResource.pawlsData.pipe(take(1)).subscribe((data) => {
      localStorage.setItem(PAWLS_KEY, JSON.stringify(data));
      location.href = '/pawls';
    });
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
}
