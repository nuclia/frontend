import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { RestartAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-restart-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './restart-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestartNodeComponent extends NodeDirective {
  restartConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as RestartAgentUI;
      return [{ title: 'Prompt', content: config.prompt }];
    }
    return [];
  });
}
