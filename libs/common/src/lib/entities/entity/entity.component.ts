import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-entity',
  templateUrl: './entity.component.html',
  styleUrl: './entity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityComponent {
  @Input({ transform: booleanAttribute }) border = false;
  @Input() backgroundColor = 'transparent';
  @Input() textColor = '#000000';
}
