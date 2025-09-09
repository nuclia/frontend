import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EditResourceService } from '../../edit-resource.service';
import { FIELD_TYPE, TextField, TextFieldData } from '@nuclia/core';
import { ActivatedRoute, Router } from '@angular/router';
import { filter, map, Observable, Subject, switchMap, take, tap } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  templateUrl: 'text.component.html',
  styleUrls: ['../../common-page-layout.scss', './text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class ResourceTextComponent implements OnInit, OnDestroy {
  unsubscribeAll = new Subject<void>();
  form = new FormGroup({
    text: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });
  isSaving = false;

  get textControl() {
    return this.form.controls['text'];
  }

  fieldId: Observable<string> = this.route.params.pipe(
    filter((params) => !!params['fieldId']),
    map((params) => params['fieldId']),
    tap((fieldId) => this.editResource.setCurrentField({ field_id: fieldId, field_type: FIELD_TYPE.text })),
  );
  field: Observable<TextFieldData> = this.fieldId.pipe(
    switchMap((fieldId) => this.editResource.getField('texts', fieldId)),
    map((fieldData) => fieldData as TextFieldData),
    tap(() => (this.isReady = true)),
  );

  textBackup?: string;
  isReady = false;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private editResource: EditResourceService,
  ) {}

  ngOnInit() {
    this.editResource.setCurrentView('resource');
    this.field.pipe(takeUntil(this.unsubscribeAll)).subscribe((field) => {
      const text = (field as TextFieldData).value?.body;
      if (text) {
        this.textBackup = text;
        this.form.setValue({ text });
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  save() {
    this.isSaving = true;
    const textField: TextField = {
      body: this.textControl.getRawValue(),
    };
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => this.editResource.updateField(FIELD_TYPE.text, fieldId, textField)),
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
    if (this.textBackup) {
      this.form.setValue({ text: this.textBackup });
      this.form.markAsPristine();
    }
  }

  deleteField() {
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => this.editResource.confirmAndDelete(FIELD_TYPE.text, fieldId)),
      )
      .subscribe((success) => {
        if (success) {
          this.router.navigate(['../../resource'], { relativeTo: this.route });
        }
      });
  }
}
