import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';

export interface ConfigBlockItem {
  key: string;
  title?: string;
  values: { value: string; description?: string }[];
}

@Component({
  selector: 'app-config-block',
  imports: [TranslatePipe],
  templateUrl: './config-block.component.html',
  styleUrl: './config-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigBlockComponent {
  config = input<ConfigBlockItem[]>([]);
}
