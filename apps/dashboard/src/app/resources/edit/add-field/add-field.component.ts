import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EditResourceService } from '../edit-resource.service';
import { FIELD_TYPE, LinkField, Resource, TextField } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';

type TextFormat = 'PLAIN' | 'HTML' | 'RST' | 'MARKDOWN';

@Component({
  selector: 'app-add-field',
  templateUrl: './add-field.component.html',
  styleUrls: ['./add-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFieldComponent implements OnInit, OnDestroy {
  availableFormats: TextFormat[] = ['PLAIN', 'HTML', 'RST', 'MARKDOWN'];
  availableTypes: FIELD_TYPE[] = [FIELD_TYPE.file, FIELD_TYPE.link, FIELD_TYPE.text];

  unsubscribeAll = new Subject<void>();
  fieldType: BehaviorSubject<FIELD_TYPE> = new BehaviorSubject<FIELD_TYPE>(FIELD_TYPE.text);
  fieldId: Observable<string> = combineLatest([
    this.fieldType,
    this.editResource.resource.pipe(
      filter((resource) => !!resource),
      map((resource) => resource as Resource),
    ),
  ]).pipe(
    map(([fieldType, resource]) => {
      const dataKey = this.editResource.getDataKeyFromFieldType(fieldType);
      if (dataKey) {
        const fieldsOfSameType = resource.getFields([dataKey]);
        return fieldsOfSameType.length > 0 ? `${fieldType}${fieldsOfSameType.length + 1}` : `${fieldType}1`;
      } else {
        return `${fieldType}1`;
      }
    }),
  );
  form = new FormGroup({
    format: new FormControl<TextFormat>('PLAIN', { nonNullable: true, validators: [Validators.required] }),
    text: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
  });
  newFile?: File;

  get formatControl() {
    return this.form.controls.format;
  }
  get textControl() {
    return this.form.controls.text;
  }

  isModified = false;
  isSaving = false;

  constructor(private editResource: EditResourceService, private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.editResource.setCurrentView('add-field');

    this.textControl.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => (this.isModified = !!value));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  changeFieldType(newType: FIELD_TYPE) {
    this.fieldType.next(newType);
    if (newType === FIELD_TYPE.file) {
      this.textControl.setValidators([]);
      this.formatControl.setValidators([]);
    } else {
      this.textControl.setValidators([Validators.required]);
      if (newType === FIELD_TYPE.text) {
        this.formatControl.setValidators([Validators.required]);
      } else {
        this.formatControl.setValidators([]);
      }
    }
    this.form.reset();
  }

  save() {
    this.isSaving = true;
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => {
          switch (this.fieldType.value) {
            case FIELD_TYPE.link:
            case FIELD_TYPE.text:
              return this.editResource.addField(this.fieldType.value, fieldId, this.getData(this.fieldType.value));
            case FIELD_TYPE.file:
              return this.editResource.addFile(fieldId, this.newFile!);
            default:
              return of(null);
          }
        }),
      )
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.isModified = false;
          this.form.reset();
          this.cdr.markForCheck();
        },
        error: () => {
          this.isSaving = false;
        },
      });
  }

  onFileChange(file: File) {
    this.newFile = file;
    this.isModified = true;
  }

  cancel() {
    this.newFile = undefined;
    this.isModified = false;
    this.form.reset();
  }

  private getData(type: FIELD_TYPE.text | FIELD_TYPE.link): TextField | LinkField {
    switch (type) {
      case FIELD_TYPE.text:
        return {
          body: this.textControl.getRawValue(),
          format: this.formatControl.getRawValue(),
        };
      case FIELD_TYPE.link:
        return {
          uri: this.textControl.getRawValue(),
        };
    }
  }
}
