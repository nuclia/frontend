import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { stfAnimations } from '@flaps/pastanaga';
import { Entities } from '@nuclia/core';
import { generatedEntitiesColor } from '../../model';

@Component({
  selector: 'app-group-select',
  templateUrl: './group-select.component.html',
  styleUrls: ['./group-select.component.scss'],
  animations: stfAnimations,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GroupSelectComponent {
  @Input() groups: Entities = {};
  @Input() selected: string | undefined;
  @Output() selectedChange = new EventEmitter<string>();
  @Input() disabled: boolean = false;

  open: boolean = false;
  colors = generatedEntitiesColor;

  constructor() {}

  onSelectGroup(group: string) {
    this.selectedChange.emit(group);
    this.open = false;
  }

  preserveOrder() {
    return 0;
  }
}
