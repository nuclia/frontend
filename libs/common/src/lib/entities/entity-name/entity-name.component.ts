import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { AppEntitiesGroup, Entity, generatedEntitiesColor } from '../model';

@Component({
  selector: 'app-entity-name',
  templateUrl: './entity-name.component.html',
  styleUrls: ['./entity-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityNameComponent {
  @Input() entity: Entity | undefined;
  @Input() isSynonym: boolean = false;
  @Input() group?: AppEntitiesGroup;
  @HostBinding('class.edit-mode') @Input() editMode: boolean = false;

  @Output() delete = new EventEmitter<void>();
  @Output() unlink = new EventEmitter<void>();

  @HostBinding('class.entity-name') defaultClass = true;
  @HostBinding('style.border-color') get color() {
    return this.group && (this.group.color || generatedEntitiesColor[this.group?.key]);
  }

  constructor() {}
}
