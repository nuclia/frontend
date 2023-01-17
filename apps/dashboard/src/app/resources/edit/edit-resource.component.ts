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
import { filter, map, Observable, Subject, take } from 'rxjs';
import { FieldId, Resource, ResourceField } from '@nuclia/core';
import { EditResourceService, EditResourceView } from './edit-resource.service';
import { NavigationService } from '../../services/navigation.service';
import { takeUntil } from 'rxjs/operators';

interface ResourceFieldWithIcon extends ResourceField {
  icon: string;
}

@Component({
  selector: 'app-edit-resource',
  templateUrl: 'edit-resource.component.html',
  styleUrls: ['edit-resource.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class EditResourceComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  backRoute: Observable<string> = this.navigationService.homeUrl.pipe(map((homeUrl) => `${homeUrl}/resources`));
  currentView: EditResourceView | null = null;
  currentField: Observable<FieldId | 'profile'> = this.editResource.currentField;
  resource: Observable<Resource | null> = this.editResource.resource;
  fields: Observable<ResourceFieldWithIcon[]> = this.editResource.fields.pipe(
    map((fields) =>
      fields.map((field) => ({
        ...field,
        icon: field.field_type === 'text' ? 'file' : field.field_type,
      })),
    ),
  );

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private editResource: EditResourceService,
    private navigationService: NavigationService,
    private element: ElementRef,
    private cdr: ChangeDetectorRef,
  ) {
    this.route.params
      .pipe(
        filter((params) => !!params.id),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((params) => this.editResource.loadResource(params.id));
  }

  ngOnInit() {
    this.editResource.currentView.subscribe((view) => {
      this.currentView = view;
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy() {
    this.editResource.reset();
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  navigateToField(field: FieldId | 'profile') {
    this.editResource.setCurrentField(field);
    const path = field === 'profile' ? `./${field}` : `./${field.field_type}/${field.field_id}`;
    this.router.navigate([path], { relativeTo: this.route });
  }

  onViewChange() {
    this.editResource.setCurrentField('profile');
  }

  isActive(field: ResourceFieldWithIcon): Observable<boolean> {
    return this.currentField.pipe(
      take(1),
      filter((current) => current !== 'profile'),
      map(
        (current) =>
          (current as FieldId).field_type === field.field_type && (current as FieldId).field_id === field.field_id,
      ),
    );
  }
}
