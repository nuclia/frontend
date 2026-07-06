import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { KVSchemaField, KVValue } from '@nuclia/core';
import { formatKeyValueFieldValue } from '../../../key-value-field-value-formatter';

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

  formatValue(key: string, value: KVValue): string {
    const field = (this.schemaFields() ?? []).find((f) => f.key === key);
    return formatKeyValueFieldValue(value, { fieldType: field?.type });
  }
}
