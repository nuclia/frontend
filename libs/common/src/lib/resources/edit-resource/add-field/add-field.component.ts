import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { EditResourceService } from '@flaps/core';
import {
  IErrorMessages,
  ModalRef,
  PaButtonModule,
  PaDropdownModule,
  PaModalModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { FIELD_TYPE, getDataKeyFromFieldType, LinkField, Resource, TextField, TextFieldFormat } from '@nuclia/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, switchMap, take } from 'rxjs';
import { DropzoneComponent } from '../dropzone/dropzone.component';

@Component({
  templateUrl: './add-field.component.html',
  styleUrl: './add-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PaDropdownModule,
    FormsModule,
    ReactiveFormsModule,
    PaTextFieldModule,
    ExpandableTextareaComponent,
    DropzoneComponent,
    PaButtonModule,
    PaModalModule,
    TranslatePipe,
  ],
})
export class AddFieldComponent {
  private editResource = inject(EditResourceService);
  private cdr = inject(ChangeDetectorRef);
  private modal = inject(ModalRef);
  private destroyRef = inject(DestroyRef);

  availableFormats: TextFieldFormat[] = ['PLAIN', 'HTML', 'RST', 'MARKDOWN', 'KEEP_MARKDOWN', 'JSON', 'JSONL'];
  availableTypes: FIELD_TYPE[] = [FIELD_TYPE.file, FIELD_TYPE.link, FIELD_TYPE.text];

  fieldType: BehaviorSubject<FIELD_TYPE> = new BehaviorSubject<FIELD_TYPE>(FIELD_TYPE.text);
  fieldId: Observable<string> = combineLatest([
    this.fieldType,
    this.editResource.resource.pipe(filter((resource): resource is Resource => !!resource)),
  ]).pipe(
    map(([fieldType, resource]) => {
      const dataKey = getDataKeyFromFieldType(fieldType);
      if (dataKey) {
        const fieldsOfSameType = resource.getFields([dataKey]);
        return fieldsOfSameType.length > 0 ? `${fieldType}${fieldsOfSameType.length + 1}` : `${fieldType}1`;
      } else {
        return `${fieldType}1`;
      }
    }),
  );
  form = new FormGroup({
    format: new FormControl<TextFieldFormat>('PLAIN', { nonNullable: true, validators: [Validators.required] }),
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

  textErrors: IErrorMessages = {
    pattern: 'validation.url_required',
  };

  constructor() {
    this.textControl.valueChanges.pipe(takeUntilDestroyed()).subscribe((value) => (this.isModified = !!value));
  }

  changeFieldType(newType: FIELD_TYPE) {
    this.newFile = undefined;
    this.isModified = false;
    this.fieldType.next(newType);
    if (newType === FIELD_TYPE.file) {
      this.textControl.setValidators([]);
      this.formatControl.setValidators([]);
    } else {
      const textValidators = [Validators.required];
      if (newType === FIELD_TYPE.link) {
        textValidators.push(Validators.pattern(/^http(s?):\/\//));
      }
      this.textControl.setValidators(textValidators);
      if (newType === FIELD_TYPE.text) {
        this.formatControl.setValidators([Validators.required]);
      } else {
        this.formatControl.setValidators([]);
      }
    }
    this.form.reset();
  }

  save() {
    if (this.isSaving || this.form.invalid || !this.isModified) {
      return;
    }
    this.isSaving = true;
    const file = this.newFile;
    this.fieldId
      .pipe(
        take(1),
        switchMap((fieldId) => {
          switch (this.fieldType.value) {
            case FIELD_TYPE.link:
            case FIELD_TYPE.text:
              return this.editResource.addField(this.fieldType.value, fieldId, this.getData(this.fieldType.value));
            case FIELD_TYPE.file:
              return file ? this.editResource.addFile(fieldId, file) : of(null);
            default:
              return of(null);
          }
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.modal.close();
        },
        error: () => {
          this.isSaving = false;
          this.cdr.markForCheck();
        },
      });
  }

  onFileChange(file: File) {
    this.newFile = file;
    this.isModified = true;
  }

  cancel() {
    this.modal.dismiss();
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
