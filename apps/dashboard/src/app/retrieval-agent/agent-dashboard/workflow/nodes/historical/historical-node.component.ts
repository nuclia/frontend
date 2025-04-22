import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-historical-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './historical-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoricalNodeComponent extends NodeDirective {
  historicalConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      // const config = this.config() as HistoricalAgent;
      // return [{ content: config.prompt }];
    }
    return [];
  });
}
