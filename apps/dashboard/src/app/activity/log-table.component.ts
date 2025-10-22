import { ChangeDetectionStrategy, Component, ElementRef, inject, Input, ViewChild } from '@angular/core';
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
import { ButtonMiniComponent, DropdownButtonComponent, SisModalService } from '@nuclia/sistema';
import { unparse } from 'papaparse';
import { ActivityLogTableModalComponent } from './log-table-modal.component';
import { BehaviorSubject, combineLatest, forkJoin, map, shareReplay, take } from 'rxjs';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { TableVirtualScrollDirective } from '@flaps/core';

@Component({
  standalone: true,
  imports: [
    ButtonMiniComponent,
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
    ScrollingModule,
    TableVirtualScrollDirective,
    TranslateModule,
  ],
  selector: 'app-log-table',
  templateUrl: 'log-table.component.html',
  styleUrls: ['log-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActivityLogTableComponent {
  private modalService = inject(SisModalService);

  wideColumns = [
    'answer',
    'filter',
    'learning_id',
    'question',
    'rag_strategies',
    'remi_scores',
    'resource_id',
    'retrieved_context',
    'token_details',
    'user_request',
  ];
  dateColumn = 'Date (UTC)';
  idColumn = 'ID';
  rowHeight = 148;
  viewportOffset = 0;

  pageSize = 200;

  data = new BehaviorSubject<LogEntry[]>([]);
  hiddenHeaders = new BehaviorSubject<string[]>([]);
  term = new BehaviorSubject<string>('');
  page = new BehaviorSubject<number>(0);

  @ViewChild('container') container?: ElementRef;

  headers = this.data.pipe(
    map((data) =>
      data.length > 0 ? [this.dateColumn, this.idColumn].concat(data[0].data.map(([key, _]) => key)) : [],
    ),
  );
  displayedHeaders = combineLatest([this.headers, this.hiddenHeaders]).pipe(
    map(([headers, hiddenHeaders]) => headers.filter((header) => !hiddenHeaders.includes(header))),
  );
  filteredRows = combineLatest([this.data, this.term]).pipe(
    map(([data, term]) => this.search(data, term)),
    shareReplay(1),
  );
  pageRows = combineLatest([this.filteredRows, this.page]).pipe(
    map(([rows, page]) => rows.slice(page * this.pageSize, (page + 1) * this.pageSize)),
  );
  totalPages = this.filteredRows.pipe(map((rows) => Math.ceil(rows.length / this.pageSize)));

  // Columns width must be fixed when using virtual scroll
  gridLayout = this.displayedHeaders.pipe(
    map((headers) => headers.map((header) => (this.wideColumns.includes(header) ? '400px' : '180px')).join(' ')),
  );

  @Input() month: string = '';
  @Input() event: string = '';
  @Input() url: string | undefined;
  @Input()
  set rows(v: LogEntry[]) {
    this.data.next(v);
  }

  search(rows: LogEntry[], term: string) {
    term = term.toLocaleLowerCase();
    if (!term) {
      return rows;
    } else {
      return rows.filter((row) => {
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
  }

  selectHeader(header: string, event: MouseEvent | KeyboardEvent) {
    if ((event.target as HTMLElement).tagName === 'LI') {
      this.toggleHeader(header);
    }
  }

  toggleHeader(header: string) {
    this.hiddenHeaders.next(
      this.hiddenHeaders.value.includes(header)
        ? this.hiddenHeaders.value.filter((item) => item !== header)
        : this.hiddenHeaders.value.concat(header),
    );
  }

  clearHeaders(event: Event) {
    event.stopPropagation();
    this.headers.pipe(take(1)).subscribe((headers) => {
      this.hiddenHeaders.next(headers);
    });
  }

  downloadCSV() {
    forkJoin([this.filteredRows.pipe(take(1)), this.displayedHeaders.pipe(take(1))]).subscribe(
      ([filteredRows, displayedHeaders]) => {
        const rows = filteredRows.map((row) => [
          ...(displayedHeaders.includes(this.dateColumn) ? [row.date] : []),
          ...(displayedHeaders.includes(this.idColumn) ? [row.id] : []),
          ...row.data
            .filter((column) => displayedHeaders.includes(column[0]))
            .map((column) =>
              column[1].type === 'object' ? JSON.stringify(column[1].value, null, 2) : column[1].value,
            ),
        ]);
        const csv = unparse([displayedHeaders, ...rows]);
        const filename = `Agentic_RAG_Activity_${this.event}_${this.month}.csv`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
          const url = URL.createObjectURL(blob);
          link.setAttribute('href', url);
          link.setAttribute('download', filename);
          link.click();
          URL.revokeObjectURL(url);
        }
      },
    );
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

  updateTerm(term: string) {
    this.term.next(term);
    this.page.next(0);
  }

  updatePage(offset: number) {
    this.page.next(this.page.value + offset);
    if (this.container) {
      this.container.nativeElement.scrollTop = 0;
    }
  }
}
