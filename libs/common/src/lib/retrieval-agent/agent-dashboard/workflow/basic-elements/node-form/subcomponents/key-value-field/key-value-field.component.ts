import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4 } from 'json-schema';
import { Subject, takeUntil, debounceTime } from 'rxjs';

let keyValueIndex = 0;

@Component({
  selector: 'app-key-value-field',
  templateUrl: './key-value-field.component.html',
  styleUrls: ['./key-value-field.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaTextFieldModule, ReactiveFormsModule, TranslateModule],
})
export class KeyValueFieldComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required: boolean = false;

  private destroy$ = new Subject<void>();
  private keyValueForm = new FormGroup({});

  get parentControl(): FormControl {
    return this.form.get(this.controlName) as FormControl;
  }

  /**
   * Determine the input type for the value field based on additionalProperties schema
   */
  get valueInputType(): string {
    if (!this.property?.additionalProperties) return 'text';

    const additionalProps = this.property.additionalProperties as JSONSchema4;

    // Check if it's a direct type
    if (additionalProps.type === 'number') return 'number';
    if (additionalProps.type === 'string') return 'text';

    // Check anyOf for number type
    if (additionalProps.anyOf) {
      const hasNumber = additionalProps.anyOf.some((item: any) => item.type === 'number');
      if (hasNumber) return 'number';
    }

    return 'text';
  }

  /**
   * Get properly typed input type for template
   */
  getValueInputType(): any {
    if (!this.property?.additionalProperties) return 'text';

    const additionalProps = this.property.additionalProperties as JSONSchema4;

    // Check if it's a direct type
    if (additionalProps.type === 'number') return 'number';
    if (additionalProps.type === 'string') return 'text';

    // Check anyOf for number type
    if (additionalProps.anyOf) {
      const hasNumber = additionalProps.anyOf.some((item: any) => item.type === 'number');
      if (hasNumber) return 'number';
    }

    return 'text';
  }

  getFormGroupFromControl(control: any): FormGroup {
    return control as FormGroup;
  }

  /**
   * Get the placeholder text for the value field based on supported types
   */
  get valuePlaceholder(): string {
    if (!this.property?.additionalProperties) return '';

    const additionalProps = this.property.additionalProperties as JSONSchema4;
    const supportedTypes: string[] = [];

    if (additionalProps.type) {
      if (Array.isArray(additionalProps.type)) {
        supportedTypes.push(...additionalProps.type);
      } else {
        supportedTypes.push(additionalProps.type);
      }
    } else if (additionalProps.anyOf) {
      additionalProps.anyOf.forEach((item: any) => {
        if (item.type && item.type !== 'null') {
          supportedTypes.push(item.type);
        }
      });
    }

    return supportedTypes.length > 0 ? `Supports: ${supportedTypes.join(', ')}` : '';
  }

  ngOnInit(): void {
    // Initialize with existing values if any
    const existingValue = this.parentControl.value;
    if (existingValue && typeof existingValue === 'object') {
      Object.entries(existingValue).forEach(([key, value]) => {
        if (key && value !== undefined && value !== null) {
          this.addKeyValue(key, String(value));
        }
      });
    }

    // Set up form synchronization - update parent form when key-value pairs change
    this.keyValueForm.valueChanges.pipe(takeUntil(this.destroy$), debounceTime(300)).subscribe(() => {
      this.syncToParentForm();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  addKeyValue(key?: string, value?: string) {
    this.keyValueForm.addControl(
      `keyValue${keyValueIndex++}`,
      new FormGroup({
        key: new FormControl<string>(key || '', { nonNullable: true, validators: [Validators.required] }),
        value: new FormControl<string>(value || '', { nonNullable: true }),
      }),
    );

    // Sync to parent form after adding
    setTimeout(() => this.syncToParentForm(), 0);
  }

  removeKeyValue(controlKey: string) {
    this.keyValueForm.removeControl(controlKey);

    // Sync to parent form after removing
    setTimeout(() => this.syncToParentForm(), 0);
  }

  /**
   * Synchronize the key-value pairs to the parent form control
   */
  private syncToParentForm() {
    const objectValue = this.getObjectValue();
    this.parentControl.setValue(objectValue);
    this.parentControl.markAsTouched();
  }

  /**
   * Get the final object value from the key-value pairs
   */
  getObjectValue(): Record<string, any> {
    const result: Record<string, any> = {};

    Object.values(this.keyValueForm.controls).forEach((control) => {
      if (control instanceof FormGroup) {
        const key = control.get('key')?.value;
        const value = control.get('value')?.value;

        if (key && value !== undefined && value !== '') {
          // Convert value to appropriate type based on additionalProperties
          result[key] = this.convertValue(value);
        }
      }
    });

    return result;
  }

  private convertValue(value: string): any {
    if (!this.property?.additionalProperties) return value;

    const additionalProps = this.property.additionalProperties as JSONSchema4;

    // Check if number type is supported
    const supportsNumber =
      additionalProps.type === 'number' ||
      (additionalProps.anyOf && additionalProps.anyOf.some((item: any) => item.type === 'number'));

    if (supportsNumber && !isNaN(Number(value))) {
      return Number(value);
    }

    return value;
  }
}
