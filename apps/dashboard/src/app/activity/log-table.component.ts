import { ChangeDetectorRef, Component, inject, Input } from '@angular/core';
import { PaButtonModule, PaDateTimeModule, PaTableModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { LogEntry } from './log.models';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  standalone: true,
  imports: [PaTableModule, PaDateTimeModule, CommonModule, PaTextFieldModule, PaButtonModule, TranslateModule],
  selector: 'app-log-table',
  templateUrl: 'log-table.component.html',
  styleUrls: ['log-table.component.scss'],
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
}
