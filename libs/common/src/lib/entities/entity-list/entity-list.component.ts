import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { Entity, NerFamily } from '../model';

const COUNT_ROWS_DISPLAYED = 1000;

@Component({
  selector: 'app-entity-list',
  templateUrl: './entity-list.component.html',
  styleUrls: ['./entity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class EntityListComponent implements OnDestroy {
  @Input()
  set family(value: NerFamily | undefined) {
    const oldValue = this._family;
    this._family = value;
    if (this.listContainer && oldValue?.key !== value?.key) {
      (this.listContainer.nativeElement as HTMLElement).scrollTo({ top: 0 });
    }
  }
  get family() {
    return this._family;
  }

  totalNERs = 0;
  displayedNERs = COUNT_ROWS_DISPLAYED;

  get entities(): Entity[] {
    const nerList = Object.values(this.family?.entities || {})
      .filter((entity) => {
        return !entity.merged && this.filterQuery.length >= 3
          ? entity.value.toLocaleLowerCase().includes(this.filterQuery.toLocaleLowerCase())
          : !entity.merged;
      })
      .sort((a, b) => a.value.localeCompare(b.value));
    this.totalNERs = nerList.length;
    return nerList.slice(0, COUNT_ROWS_DISPLAYED);
  }

  @Input() filterQuery = '';
  @ViewChild('listContainer') listContainer?: ElementRef;

  unsubscribeAll = new Subject<void>();

  private _family: NerFamily | undefined;

  constructor() {}

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
