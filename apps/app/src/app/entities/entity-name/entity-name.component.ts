import { Component, Input, Output, EventEmitter, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { AppEntitiesGroup, Entity, GROUP_COLORS } from '../model';

@Component({
  selector: 'app-entity-name',
  templateUrl: './entity-name.component.html',
  styleUrls: ['./entity-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityNameComponent {

  @Input() entity: Entity | undefined;
  @Input() isSynonym: boolean = false;
  @Input() editMode: boolean = false;
  @Input() group?: AppEntitiesGroup;

  @Output() delete = new EventEmitter<void>();
  @Output() unlink = new EventEmitter<void>();

  @HostBinding('class.entity-name') defaultClass = true;
  @HostBinding('style.border-color') get color() {
    return this.group && (this.group.color || GROUP_COLORS[this.group?.key]);
  }

  constructor() { }
}