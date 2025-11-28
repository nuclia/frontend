import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';

export interface ConfigBlockItem {
  key: string;
  title?: string;
  content: string;
}

@Component({
  selector: 'app-config-block',
  imports: [TranslateModule],
  templateUrl: './config-block.component.html',
  styleUrl: './config-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigBlockComponent {
  config = input<ConfigBlockItem[]>([]);
  labels = input<{ [field: string]: { [key: string]: string } }>({});
}
