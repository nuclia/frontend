import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { KVRange, KVSchema, KVSchemaField, KVValue } from '@nuclia/core';
import { formatKeyValue } from '../../edit-resource.helpers';

@Component({
  selector: 'stf-key-value-field',
  templateUrl: './key-value-field.component.html',
  styleUrl: './key-value-field.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class KeyValueFieldComponent {
  fieldId = input<string>();
  data = input<Record<string, KVValue> | undefined>();
  schema = input<KVSchema>();
  schemaFields = computed(() => this.schema()?.fields || []);
  title = computed(() => this.schema()?.id || '');

  private datePipe = inject(DatePipe);

  formatValue(key: string, value: KVValue): string {
    const field = (this.schemaFields() ?? []).find((f) => f.key === key);
    if (field?.type === 'date' && typeof value === 'string' && value) {
      return this.datePipe.transform(value, 'MMM dd, yyyy') ?? String(value);
    } else {
      return formatKeyValue(value);
    }
  }
}
