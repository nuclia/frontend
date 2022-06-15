import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { Entity } from '../model';

let nextId = 0;

@Component({
  selector: 'app-synonym-add',
  templateUrl: './synonym-add.component.html',
  styleUrls: ['./synonym-add.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SynonymAddComponent {
  @Input() entities: Entity[] = [];
  @Input() ignore: Entity[] = [];
  @Output() add = new EventEmitter<Entity>();
  id: string;
  openAutocomplete: boolean = false;
  filterInput = new FormControl();
  items$: Observable<Entity[]>;

  constructor() {
    this.id = `synonym-add${nextId++}`;

    this.items$ = this.filterInput.valueChanges.pipe(
      startWith([]),
      map((input) => (input?.length > 2 ? this.filterEntities(input) : [])),
    );
  }

  filterEntities(text: string): Entity[] {
    const regex = new RegExp(`(${text})`, 'i');
    return this.entities.filter(
      (entity) => regex.test(entity.value) && this.ignore.every((item) => item.value !== entity.value),
    );
  }

  toggle() {
    this.openAutocomplete = !this.openAutocomplete;
    this.filterInput.reset();
  }

  addSynonym(entity: Entity) {
    this.openAutocomplete = false;
    this.add.emit(entity);
  }
}
