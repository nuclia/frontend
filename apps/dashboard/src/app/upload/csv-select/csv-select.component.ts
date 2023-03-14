import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { parseCsv } from '../utils';
import { SisToastService } from '@nuclia/sistema';

@Component({
  selector: 'app-csv-select',
  templateUrl: './csv-select.component.html',
  styleUrls: ['./csv-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CsvSelectComponent<T> {
  @Input()
  set fields(value: number) {
    this._fields = coerceNumberProperty(value, 0);
  }
  get fields() {
    return this._fields;
  }
  private _fields: number = 0;

  @Input() help: string[] = [];
  @Output() select = new EventEmitter<string[][]>();

  constructor(private toaster: SisToastService) {}

  readCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const cvs = parseCsv(reader.result as string);
        const isValid = cvs.every((row) => row.length === this.fields);
        if (isValid) {
          this.select.emit(cvs);
        } else {
          this.toaster.error('upload.invalid_csv');
        }
      };
      reader.onerror = () => {
        this.toaster.error('upload.invalid_csv');
      };
      reader.readAsText(file, 'UTF-8');
    }
  }
}
