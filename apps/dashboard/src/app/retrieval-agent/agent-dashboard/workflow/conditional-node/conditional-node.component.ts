import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AgentBoxComponent, BoxDirective, ConnectableEntryComponent, InfoBlockComponent } from '../basic-elements';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-conditional-node',
  imports: [CommonModule, TranslateModule, AgentBoxComponent, ConnectableEntryComponent, InfoBlockComponent],
  templateUrl: './conditional-node.component.html',
  styleUrl: './conditional-node.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalNodeComponent extends BoxDirective {
  ifData = input('');
}
