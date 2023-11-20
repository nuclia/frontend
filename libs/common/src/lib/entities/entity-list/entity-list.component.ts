import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { Subject } from 'rxjs';
import { Entity, NerFamily } from '../model';
import { EntitiesService } from '../entities.service';

@Component({
  selector: 'app-entity-list',
  templateUrl: './entity-list.component.html',
  styleUrls: ['./entity-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityListComponent implements OnInit, OnDestroy {
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

  get entities(): Entity[] {
    return Object.values(this.family?.entities || {})
      .filter((entity) => {
        return !entity.merged && this.filterQuery.length >= 3
          ? entity.value.toLocaleLowerCase().includes(this.filterQuery.toLocaleLowerCase())
          : !entity.merged;
      })
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  @Input() selection: string[] = [];
  @Input() filterQuery = '';
  @Output() selectionChange: EventEmitter<string[]> = new EventEmitter();
  @ViewChild('listContainer') listContainer?: ElementRef;

  unsubscribeAll = new Subject<void>();
  isAdminOrContrib = this.entitiesService.isAdminOrContrib;

  private _family: NerFamily | undefined;

  constructor(
    private cdr: ChangeDetectorRef,
    private entitiesService: EntitiesService,
  ) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  trackByValue(index: number, ner: Entity) {
    return ner.value;
  }

  removeDuplicate(ner: Entity, duplicate: string) {
    if (this.family) {
      this.entitiesService.removeDuplicate(this.family.key, ner, duplicate).subscribe(() => this.cdr.markForCheck());
    }
  }

  toggleSelection(ner: string) {
    if (this.selection.includes(ner)) {
      this.selection = this.selection.filter((id) => id !== ner);
    } else {
      this.selection = this.selection.concat([ner]);
    }
    this.selectionChange.emit(this.selection);
  }
}
