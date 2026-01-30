import { ChangeDetectionStrategy, Component, Input, OnInit, signal, computed, OnDestroy } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';

import { TranslateModule } from '@ngx-translate/core';
import { JSONSchema4, JSONSchema4Type } from 'json-schema';
import { Subject, takeUntil } from 'rxjs';

interface OptionModel {
  id: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-enum-select',
  templateUrl: './enum-select.component.html',
  styleUrls: ['./enum-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, TranslateModule],
})
export class EnumSelectComponent implements OnInit, OnDestroy {
  @Input() form!: FormGroup;
  @Input() controlName!: string;
  @Input() label!: string;
  @Input() property!: JSONSchema4;
  @Input() required = false;
  @Input() showChildrenWhenValue?: string; // When selected value equals this, show children

  private destroy$ = new Subject<void>();

  options = signal<OptionModel[] | null>(null);
  currentValue = signal<string | null>(null);

  // Computed signal to determine if children should be shown
  showChildren = computed(() => {
    if (!this.showChildrenWhenValue) return false;
    return this.currentValue() === this.showChildrenWhenValue;
  });

  ngOnInit() {
    this.initializeOptions();
    this.setupFormValueSubscription();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupFormValueSubscription() {
    const control = this.form.get(this.controlName);
    if (control) {
      // Set initial value
      this.currentValue.set(control.value);

      // Subscribe to value changes
      control.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((value) => {
        this.currentValue.set(value);
      });
    }
  }

  private initializeOptions() {
    const enumValues = this.getEnumValues();
    this.options.set(
      enumValues.map((value) => ({
        id: value,
        label: value,
        value: value,
      })),
    );
  }

  private getEnumValues(): string[] {
    if (this.property.enum) {
      return this.property.enum.filter((value): value is string => typeof value === 'string');
    }
    if (this.property.anyOf) {
      const enumType = this.property.anyOf.find((t: any) => t.enum);
      return enumType?.enum?.filter((value: JSONSchema4Type): value is string => typeof value === 'string') || [];
    }
    return [];
  }
}
