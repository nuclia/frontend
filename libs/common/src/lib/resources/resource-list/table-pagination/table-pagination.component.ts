import { ChangeDetectionStrategy, Component, EventEmitter, Input, numberAttribute, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaDropdownModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { DropdownButtonComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-table-pagination',
  standalone: true,
  imports: [CommonModule, PaButtonModule, PaIconModule, TranslateModule, DropdownButtonComponent, PaDropdownModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginationComponent {
  @Input({ transform: numberAttribute })
  set totalPages(value: number) {
    this._totalPages = value;
    this.generatePagination();
  }
  get totalPages() {
    return this._totalPages;
  }
  @Input({ transform: numberAttribute })
  set page(value: number) {
    this._page = value;
    this.generatePagination();
  }
  get page() {
    return this._page;
  }

  @Input({ transform: numberAttribute }) items = 0;
  @Input({ transform: numberAttribute }) totalItems = 0;
  @Input({ transform: numberAttribute }) totalKbResources = 0;
  @Input({ transform: numberAttribute }) pageSize = 0;
  @Input() pageSizes: number[] = [];

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();

  private _totalPages = 0;
  private _page = 0;
  pages: (number | '…')[] = [];

  get from() {
    return this.page * this.pageSize + 1;
  }

  get to() {
    return Math.min(this.page * this.pageSize + this.pageSize, this.totalItems);
  }

  generatePagination() {
    const visiblePages = [0, 1]
      .concat([this.page - 1, this.page, this.page + 1])
      .concat([this.totalPages - 1, this.totalPages]);

    this.pages = [...Array(this.totalPages).keys()]
      .map((page) => (visiblePages.includes(page) ? page : '…'))
      .filter((page, index, pages) => pages[index - 1] !== page);
  }

  goTo(page: number) {
    this.pageChange.emit(page);
  }
}
