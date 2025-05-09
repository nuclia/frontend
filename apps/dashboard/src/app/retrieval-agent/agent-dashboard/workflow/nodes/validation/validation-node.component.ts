import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import {
  ConfigBlockComponent,
  ConfigBlockItem,
  ConnectableEntryComponent,
  NodeBoxComponent,
  NodeDirective,
} from '../../basic-elements';
import { ValidationAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-validation-node',
  imports: [CommonModule, ConfigBlockComponent, NodeBoxComponent, TranslateModule, ConnectableEntryComponent],
  templateUrl: './validation-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ValidationNodeComponent extends NodeDirective {
  validationConfig = computed<ConfigBlockItem[]>(() => {
    // FIXME So far there is no prompt on the backend model for validation. Waiting for Ramon’s confirmation it's in purpose
    if (this.config()) {
      const config = this.config() as ValidationAgentUI;
      return [{ content: config.prompt }];
    }
    return [];
  });
}
