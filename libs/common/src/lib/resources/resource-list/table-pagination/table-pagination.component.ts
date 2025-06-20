
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  numberAttribute,
  OnInit,
  Output,
} from '@angular/core';
import { PaButtonModule, PaDropdownModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { RESOURCE_STATUS } from '@nuclia/core';
import { DropdownButtonComponent } from '@nuclia/sistema';
import { ResourceListService } from '../resource-list.service';

@Component({
  selector: 'stf-table-pagination',
  standalone: true,
  imports: [PaButtonModule, PaIconModule, TranslateModule, DropdownButtonComponent, PaDropdownModule],
  templateUrl: './table-pagination.component.html',
  styleUrl: './table-pagination.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TablePaginationComponent implements OnInit {
  private resourceListService = inject(ResourceListService);
  private cdr = inject(ChangeDetectorRef);

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

  @Input({ transform: booleanAttribute }) noDownload = false;
  @Input({ transform: numberAttribute }) totalItems = 0;
  @Input({ transform: numberAttribute }) totalKbResources = 0;
  @Input({ transform: numberAttribute }) pageSize = 0;
  @Input() pageSizes: number[] = [];

  @Output() pageChange: EventEmitter<number> = new EventEmitter<number>();
  @Output() pageSizeChange: EventEmitter<number> = new EventEmitter<number>();

  private _totalPages = 0;
  private _page = 0;
  pages: (number | '…')[] = [];
  loading = false;
  isErrorsView = false;

  get from() {
    return this.page * this.pageSize + 1;
  }

  get to() {
    return Math.min(this.page * this.pageSize + this.pageSize, this.totalItems);
  }

  ngOnInit() {
    this.isErrorsView = this.resourceListService.status === RESOURCE_STATUS.ERROR;
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

  download(errors = false) {
    this.loading = true;
    this.resourceListService.downloadResources(errors ? RESOURCE_STATUS.ERROR : undefined).subscribe(() => {
      this.loading = false;
      this.cdr.markForCheck();
    });
  }
}
