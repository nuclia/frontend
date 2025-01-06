import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { filter, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { FIELD_TYPE, LinkField, LinkFieldData } from '@nuclia/core';
import { ActivatedRoute } from '@angular/router';
import { EditResourceService } from '../../edit-resource.service';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: 'link.component.html',
  styleUrls: ['../../common-page-layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourceLinkComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  form = new FormGroup({
    link: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  isSaving = false;

  get linkControl() {
    return this.form.controls['link'];
  }

  fieldId: Observable<string> = this.route.params.pipe(
    filter((params) => !!params['fieldId']),
    map((params) => params['fieldId']),
    tap((fieldId) => this.editResource.setCurrentField({ field_type: FIELD_TYPE.link, field_id: fieldId })),
  );
  field: Observable<LinkFieldData> = this.fieldId.pipe(
    switchMap((fieldId) => this.editResource.getField('links', fieldId)),
    map((fieldData) => fieldData as LinkFieldData),
    tap(() => (this.isReady = true)),
  );

  linkBackup?: string;
  isReady = false;

  constructor(private route: ActivatedRoute, private editResource: EditResourceService) {}

  ngOnInit() {
    this.editResource.setCurrentView('resource');
    this.field.pipe(takeUntil(this.unsubscribeAll)).subscribe((field) => {
      const link = (field as LinkFieldData).value?.uri;
      if (link) {
        this.linkBackup = link;
        this.form.setValue({ link });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    const linkField: LinkField = {
      uri: this.linkControl.getRawValue(),
    };
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => this.editResource.updateField(FIELD_TYPE.link, fieldId, linkField)),
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.form.markAsPristine();
        },
        error: () => (this.isSaving = false),
      });
  }

  cancel() {
    if (this.linkBackup) {
      this.form.setValue({ link: this.linkBackup });
      this.form.markAsPristine();
    }
  }

  deleteField() {
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => this.editResource.confirmAndDelete(FIELD_TYPE.link, fieldId, this.route)),
      )
      .subscribe();
  }
}
