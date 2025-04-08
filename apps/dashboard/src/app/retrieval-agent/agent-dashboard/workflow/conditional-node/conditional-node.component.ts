import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AgentBoxComponent, ConnectableEntryComponent, InfoBlockComponent, NodeDirective } from '../basic-elements';

@Component({
  selector: 'app-conditional-node',
  imports: [CommonModule, TranslateModule, AgentBoxComponent, ConnectableEntryComponent, InfoBlockComponent],
  templateUrl: './conditional-node.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent extends NodeDirective {
  ifData = input('');
}
