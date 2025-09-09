
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { BaseConditionalAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-conditional-node',
  imports: [TranslateModule, NodeBoxComponent, ConnectableEntryComponent, ConfigBlockComponent],
  templateUrl: './conditional-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent extends NodeDirective {
  conditionalConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as BaseConditionalAgentUI;
      return [{ content: config.prompt }];
    }
    return [];
  });
}
