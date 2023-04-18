import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  Input,
  OnDestroy,
  OnInit,
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
      .filter((entity) => !entity.merged)
      .sort((a, b) => a.value.localeCompare(b.value));
  }

  @ViewChild('listContainer') listContainer?: ElementRef;
  @ViewChild('entityInput') entityInput?: ElementRef;

  unsubscribeAll = new Subject<void>();
  deletedNer?: string;
  duplicatedEntity?: Entity;
  matchingEntities: Entity[] = [];

  private _family: NerFamily | undefined;

  constructor(private cdr: ChangeDetectorRef, private entitiesService: EntitiesService) {}

  ngOnInit(): void {}

  ngOnDestroy(): void {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  trackByValue(index: number, ner: Entity) {
    return ner.value;
  }

  deleteEntity(ner: Entity) {
    if (this.family) {
      this.deletedNer = ner.value;
      this.entitiesService.deleteEntity(this.family.key, ner.value).subscribe(() => (this.deletedNer = undefined));
    }
  }

  openDuplicatesOfPopup(ner: Entity) {
    this.duplicatedEntity = ner;
    if (this.entityInput) {
      const inputElement: HTMLInputElement = this.entityInput.nativeElement;
      setTimeout(() => {
        inputElement.focus();
        this.cdr.markForCheck();
      });
    }
  }

  getMatchingEntities(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    if (value.length > 2) {
      this.matchingEntities = this.entities.filter((entity) => entity.value.startsWith(value));
    }
  }
  addDuplicateOf(entity: Entity) {
    if (this.family && this.duplicatedEntity) {
      this.entitiesService.addDuplicate(this.family.key, this.duplicatedEntity, entity).subscribe(() => {
        this.duplicatedEntity = undefined;
        this.matchingEntities = [];
      });
    }
  }
  removeDuplicate(ner: Entity, duplicate: string) {
    if (this.family) {
      this.entitiesService.removeDuplicate(this.family.key, ner, duplicate).subscribe();
    }
  }
}
