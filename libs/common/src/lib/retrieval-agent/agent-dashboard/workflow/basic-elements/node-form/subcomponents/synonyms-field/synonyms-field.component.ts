import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4 } from 'json-schema';
import { Subject, debounceTime, takeUntil } from 'rxjs';

let synonymsIndex = 0;

@Component({
  selector: 'app-synonyms-field',
  templateUrl: './synonyms-field.component.html',
  styleUrls: ['./synonyms-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class SynonymsFieldComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;

  private destroy$ = new Subject<void>();
  synonymsForm = new FormGroup({});

  get parentControl(): FormControl {
    return this.form.get(this.controlName) as FormControl;
  }

  ngOnInit(): void {
    const existingValue = this.parentControl.value;
    if (existingValue && typeof existingValue === 'object') {
      Object.entries(existingValue as Record<string, string[]>).forEach(([key, values]) => {
        if (key) {
          this.addEntry(key, Array.isArray(values) ? values : []);
        }
      });
    }

    this.synonymsForm.valueChanges
      .pipe(takeUntil(this.destroy$), debounceTime(200))
      .subscribe(() => this.syncToParentForm());

    // Initial sync when empty
    if (!existingValue || Object.keys(existingValue).length === 0) {
      this.syncToParentForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addEntry(key?: string, values?: string[]) {
    const valuesArray = new FormArray<FormControl<string>>([]);
    (values || []).forEach((v) => valuesArray.push(new FormControl<string>(v ?? '', { nonNullable: true })));

    this.synonymsForm.addControl(
      `synonyms${synonymsIndex++}`,
      new FormGroup({
        key: new FormControl<string>(key || '', { nonNullable: true, validators: [Validators.required] }),
        values: valuesArray,
      }),
    );

    // Sync after adding
    setTimeout(() => this.syncToParentForm(), 0);
  }

  removeEntry(controlKey: string) {
    this.synonymsForm.removeControl(controlKey);
    setTimeout(() => this.syncToParentForm(), 0);
  }

  getGroupFromControl(control: any): FormGroup {
    return control as FormGroup;
  }

  getValuesArray(groupKey: string): FormArray<FormControl<string>> {
    const control = this.synonymsForm.get(groupKey) as FormGroup;
    return control.get('values') as FormArray<FormControl<string>>;
  }

  addSynonym(groupKey: string) {
    const values = this.getValuesArray(groupKey);
    values.push(new FormControl<string>('', { nonNullable: true }));
    setTimeout(() => this.syncToParentForm(), 0);
  }

  removeSynonym(groupKey: string, index: number) {
    const values = this.getValuesArray(groupKey);
    values.removeAt(index);
    setTimeout(() => this.syncToParentForm(), 0);
  }

  private syncToParentForm() {
    const objectValue = this.getObjectValue();
    this.parentControl.setValue(objectValue);
    this.parentControl.markAsTouched();
  }

  getObjectValue(): Record<string, string[]> | undefined {
    const result: Record<string, string[]> = {};
    let hasValidEntries = false;

    Object.entries(this.synonymsForm.controls).forEach(([groupKey, control]) => {
      if (control instanceof FormGroup) {
        const key = control.get('key')?.value as string;
        const valuesArray = control.get('values') as FormArray<FormControl<string>>;
        const values: string[] = (valuesArray?.controls || [])
          .map((c) => c.value)
          .filter((v) => v !== undefined && v !== null && String(v).trim() !== '')
          .map((v) => String(v));

        if (key && values.length > 0) {
          result[key] = values;
          hasValidEntries = true;
        }
      }
    });

    return hasValidEntries ? result : undefined;
  }
}
