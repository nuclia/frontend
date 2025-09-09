import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import {
  ModalConfig,
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { LogEntry, LogValueObject, LogValueString } from './log.models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownButtonComponent, SisModalService } from '@nuclia/sistema';
import { unparse } from 'papaparse';
import { ActivityLogTableModalComponent } from './log-table-modal.component';

@Component({
  standalone: true,
  imports: [
    PaTableModule,
    PaDateTimeModule,
    CommonModule,
    PaTextFieldModule,
    PaTogglesModule,
    PaDropdownModule,
    DropdownButtonComponent,
    PaButtonModule,
    PaModalModule,
    PaTooltipModule,
    TranslateModule,
  ],
  selector: 'app-log-table',
  templateUrl: 'log-table.component.html',
  styleUrls: ['log-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTableComponent {
  private cdr = inject(ChangeDetectorRef);
  private modalService = inject(SisModalService);

  dateColumn = 'Date (UTC)';
  idColumn = 'ID';

  @Input() month: string = '';
  @Input() event: string = '';
  @Input() url: string | undefined;
  @Input()
  set rows(v: LogEntry[]) {
    this._rows = v;
    this.displayedRows = v;
    if (this._rows.length > 0) {
      this.headers = [this.dateColumn, this.idColumn].concat(this._rows[0].data.map(([key, _]) => key));
    }
  }
  get rows(): LogEntry[] {
    return this._rows;
  }
  private _rows: LogEntry[] = [];

  displayedRows: LogEntry[] = [];
  headers: string[] = [];
  hiddenHeaders: string[] = [];
  maxLines = 6;
  maxCharacters = 300;

  get displayedHeaders() {
    return this.headers.filter((header) => !this.hiddenHeaders.includes(header));
  }

  search(term: string) {
    term = term.toLocaleLowerCase();
    if (!term) {
      this.displayedRows = this._rows;
    } else {
      this.displayedRows = this._rows.filter((row) => {
        return (
          row.date.includes(term) ||
          row.data.some(([_, value]) => {
            if (value.type === 'string') {
              return value.value.toLocaleLowerCase().includes(term);
            }
            return JSON.stringify(value.value).toLocaleLowerCase().includes(term);
          })
        );
      });
    }
    this.cdr.detectChanges();
  }

  selectHeader(header: string, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      this.toggleHeader(header);
    }
  }

  toggleHeader(header: string) {
    this.hiddenHeaders = this.hiddenHeaders.includes(header)
      ? this.hiddenHeaders.filter((item) => item !== header)
      : this.hiddenHeaders.concat(header);
  }

  downloadCSV() {
    const headers = this.displayedHeaders;
    const rows = this.rows.map((row) => [
      ...(this.displayedHeaders.includes(this.dateColumn) ? [row.date] : []),
      ...(this.displayedHeaders.includes(this.idColumn) ? [row.id] : []),
      ...row.data
        .filter((column) => this.displayedHeaders.includes(column[0]))
        .map((column) => (column[1].type === 'object' ? JSON.stringify(column[1].value, null, 2) : column[1].value)),
    ]);
    const csv = unparse([headers, ...rows]);
    const filename = `Nuclia_Activity_${this.event}_${this.month}.csv`;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.click();
      URL.revokeObjectURL(url);
    }
  }

  downloadJSON() {
    if (this.url) {
      const link = document.createElement('a');
      link.setAttribute('href', this.url);
      link.setAttribute('target', '_new');
      link.click();
    }
  }

  showMore(cell: [string, LogValueString | LogValueObject]) {
    this.modalService.openModal(
      ActivityLogTableModalComponent,
      new ModalConfig({ data: { title: cell[0], value: cell[1].value, json: cell[1].type === 'object' } }),
    );
  }
}
