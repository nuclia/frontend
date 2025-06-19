import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { coerceNumberProperty } from '@angular/cdk/coercion';
import { parseCsv } from '../csv-parser';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { ConfirmationData, Kind, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { filter } from 'rxjs';

import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HintModule } from '../../hint';

@Component({
  selector: 'app-csv-select',
  templateUrl: './csv-select.component.html',
  styleUrls: ['./csv-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HintModule, PaButtonModule, TranslateModule],
})
export class CsvSelectComponent<T> {
  @Input()
  set fields(value: number) {
    this._fields = coerceNumberProperty(value, 0);
  }
  get fields() {
    return this._fields;
  }

  @Input()
  set buttonKind(value: Kind | undefined) {
    if (value) {
      this._buttonKind = value;
    }
  }
  get buttonKind(): Kind {
    return this._buttonKind;
  }
  private _buttonKind: Kind = 'primary';

  @Input()
  set confirmData(value: ConfirmationData | undefined) {
    this._confirmData = value;
  }
  get confirmData(): ConfirmationData | undefined {
    return this._confirmData;
  }

  @Input() help: string[] = [];
  @Output() select = new EventEmitter<string[][]>();

  @ViewChild('fileUpload') fileUpload?: ElementRef;

  private _confirmData?: ConfirmationData;
  private _fields = 0;

  constructor(
    private toaster: SisToastService,
    private modalService: SisModalService,
    private translate: TranslateService,
  ) {}

  onUpload() {
    if (this.confirmData) {
      this.modalService
        .openConfirm(this.confirmData)
        .onClose.pipe(filter((confirm) => !!confirm))
        .subscribe(() => this.openUploadDialog());
    } else {
      this.openUploadDialog();
    }
  }

  readCsv(event: Event) {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        const csv = parseCsv(reader.result as string);
        const isValid = csv.every((row) => row.length === this.fields);
        if (isValid) {
          this.select.emit(csv);
        } else {
          this.toaster.error(this.translate.instant('upload.invalid_csv', { num: this.fields }));
        }
      };
      reader.onerror = () => {
        this.toaster.error(this.translate.instant('upload.invalid_csv', { num: this.fields }));
      };
      reader.readAsText(file, 'UTF-8');
    }
  }

  private openUploadDialog() {
    this.fileUpload?.nativeElement.click();
  }
}
