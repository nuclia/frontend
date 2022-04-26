import { Component, Input, Output, EventEmitter, HostBinding, ChangeDetectionStrategy } from '@angular/core';
import { Entity } from '../model';

@Component({
  selector: 'app-entity-name',
  templateUrl: './entity-name.component.html',
  styleUrls: ['./entity-name.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EntityNameComponent {

  @Input() entity: Entity | undefined;
  @Input() isSynonym: boolean = false;

  @Output() delete = new EventEmitter<void>();
  @Output() unlink = new EventEmitter<void>();

  @HostBinding('class.entity-name') defaultClass = true;
  @HostBinding('class.edit-mode') @Input() editMode: boolean = false;

  constructor() { }
}