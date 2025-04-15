import { booleanAttribute, ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-entity',
  imports: [CommonModule, TranslateModule],
  templateUrl: './entity.component.html',
  styleUrl: './entity.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityComponent {
  @Input({ transform: booleanAttribute }) border = false;
  @Input() backgroundColor: string = 'transparent';
  @Input() textColor: string = '#000000';
}
