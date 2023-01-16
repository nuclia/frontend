import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { EditResourceService } from '../../edit-resource.service';
import { FIELD_TYPE, TextField, TextFieldData } from '@nuclia/core';
import { ActivatedRoute } from '@angular/router';
import { filter, map, Observable, Subject, switchMap, take } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-resource-text',
  templateUrl: 'text.component.html',
  styleUrls: ['./text.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    filter((params) => !!params.fieldId),
    map((params) => params.fieldId),
  );
  field: Observable<TextFieldData> = this.fieldId.pipe(
    switchMap((fieldId) => this.editResource.getField('texts', fieldId)),
    map((fieldData) => fieldData as TextFieldData),
  );

  textBackup?: string;

  constructor(private route: ActivatedRoute, private editResource: EditResourceService) {}

  ngOnInit() {
    this.editResource.setCurrentView('profile');
    this.editResource.setCurrentField(FIELD_TYPE.text);
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
      .subscribe(() => {
        this.isSaving = false;
        this.form.markAsPristine();
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
        switchMap((fieldId) => this.editResource.confirmAndDelete(FIELD_TYPE.text, fieldId, this.route)),
      )
      .subscribe();
  }
}
