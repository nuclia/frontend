import { coerceNumberProperty } from '@angular/cdk/coercion';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateDirective, TranslateModule, TranslatePipe } from '@ngx-translate/core';

@Component({
  selector: 'stf-pagination',
  templateUrl: './pagination.component.html',
  styleUrls: ['./pagination.component.scss'],
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [PaButtonModule, TranslateDirective, TranslatePipe, TranslateModule],
})
export class PaginationComponent {
  @Input()
  set page(value: string | number) {
    this._page = coerceNumberProperty(value);
  }
  _page = 0;

  @Input() set total(value: string | number) {
    this._total = coerceNumberProperty(value);
  }
  _total = 1;

  @Output() prev = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() pageChange = new EventEmitter<number>();
}
