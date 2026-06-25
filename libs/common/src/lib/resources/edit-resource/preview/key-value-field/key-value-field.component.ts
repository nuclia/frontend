import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { KVRange, KVSchemaField, KVValue } from '@nuclia/core';

@Component({
  selector: 'stf-key-value-field',
  templateUrl: './key-value-field.component.html',
  styleUrl: './key-value-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KeyValueFieldComponent {
  fieldId = input.required<string>();
  data = input<Record<string, KVValue> | undefined>();
  schemaFields = input<KVSchemaField[]>();

  private datePipe = inject(DatePipe);

  formatValue(key: string, value: KVValue): string {
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (value !== null && typeof value === 'object') {
      const range = value as KVRange;
      return `${range.lower} – ${range.upper}`;
    }
    const field = (this.schemaFields() ?? []).find((f) => f.key === key);
    if (field?.type === 'date' && typeof value === 'string' && value) {
      return this.datePipe.transform(value, 'MMM dd, yyyy') ?? String(value);
    }
    return String(value);
  }
}
