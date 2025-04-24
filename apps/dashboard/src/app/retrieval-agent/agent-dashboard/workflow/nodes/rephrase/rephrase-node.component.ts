import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { RephraseAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-rephrase-node',
  imports: [CommonModule, NodeBoxComponent, TranslateModule, ConfigBlockComponent],
  templateUrl: './rephrase-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseNodeComponent extends NodeDirective {
  rephraseConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as RephraseAgentUI;
      const items: ConfigBlockItem[] = [];
      if (config.kb) {
        items.push({ title: 'Knowledge Box', content: config.kb });
      }
      items.push({ title: 'Prompt', content: config.prompt });
      return items;
    }
    return [];
  });
}
