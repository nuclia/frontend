import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { ExternalAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-external-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './external-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExternalNodeComponent extends NodeDirective {
  externalConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as ExternalAgentUI;
      return [{ title: 'URL', content: config.url }];
    }
    return [];
  });
}
