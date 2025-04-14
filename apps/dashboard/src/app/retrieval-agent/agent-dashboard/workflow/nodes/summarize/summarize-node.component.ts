import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';
import { SummarizeAgent } from '../../workflow.models';

@Component({
  selector: 'app-summarize-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './summarize-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeNodeComponent extends NodeDirective {
  summarizeConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      const config = this.config() as SummarizeAgent;
      return [{ title: 'Prompt', content: config.prompt }];
    }
    return [];
  });
}
