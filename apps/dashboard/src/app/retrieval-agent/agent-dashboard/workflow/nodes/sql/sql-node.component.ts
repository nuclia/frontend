import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigBlockComponent, ConfigBlockItem, NodeBoxComponent, NodeDirective } from '../../basic-elements';

@Component({
  selector: 'app-sql-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule],
  templateUrl: './sql-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SqlNodeComponent extends NodeDirective {
  sqlConfig = computed<ConfigBlockItem[]>(() => {
    if (this.config()) {
      // const config = this.config() as SqlAgent;
      // return [{ content: config.prompt }];
    }
    return [];
  });
}
