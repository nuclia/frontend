import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-entity',
  imports: [TranslateModule],
  templateUrl: './entity.component.html',
  styleUrl: './entity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityComponent {
  @Input({ transform: booleanAttribute }) border = false;
  @Input() backgroundColor: string = 'transparent';
  @Input() textColor: string = '#000000';
}
