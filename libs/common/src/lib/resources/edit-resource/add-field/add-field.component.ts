import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { EditResourceService } from '../edit-resource.service';
import { FIELD_TYPE, getDataKeyFromFieldType, LinkField, Resource, TextField, TextFieldFormat } from '@nuclia/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { BehaviorSubject, combineLatest, filter, map, Observable, of, Subject, switchMap, take, takeUntil } from 'rxjs';
import { IErrorMessages } from '@guillotinaweb/pastanaga-angular';
import { ActivatedRoute } from '@angular/router';
import { ResourceNavigationService } from '../resource-navigation.service';

@Component({
  templateUrl: './add-field.component.html',
  styleUrls: ['../common-page-layout.scss', './add-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddFieldComponent implements OnInit, OnDestroy {
  availableFormats: TextFieldFormat[] = ['PLAIN', 'HTML', 'RST', 'MARKDOWN', 'KEEP_MARKDOWN', 'JSON'];
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

  constructor(
    private editResource: EditResourceService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private resourceNavigation: ResourceNavigationService,
  ) {
    this.resourceNavigation.currentRoute = this.route;
  }

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
