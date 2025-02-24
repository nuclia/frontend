import { ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import {
  PaButtonModule,
  PaDateTimeModule,
  PaDropdownModule,
  PaModalModule,
  PaTableModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { LogEntry } from './log.models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownButtonComponent } from '@nuclia/sistema';

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
    TranslateModule,
  ],
  selector: 'app-log-table',
  templateUrl: 'log-table.component.html',
  styleUrls: ['log-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTableComponent {
  private cdr = inject(ChangeDetectorRef);
  @Input()
  set rows(v: LogEntry[]) {
    this._rows = v;
    this.displayedRows = v;
    if (this._rows.length > 0) {
      this.headers = ['Date', 'ID'].concat(this._rows[0].data.map(([key, _]) => key));
    }
  }
  get rows(): LogEntry[] {
    return this._rows;
  }
  private _rows: LogEntry[] = [];

  displayedRows: LogEntry[] = [];
  headers: string[] = [];
  hiddenHeaders: string[] = [];

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
}
