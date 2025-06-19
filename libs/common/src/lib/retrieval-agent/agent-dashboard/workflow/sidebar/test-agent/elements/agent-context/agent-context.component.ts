
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { PaExpanderModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { AragAnswerContext } from '@nuclia/core';
import { LineBreakFormatterPipe } from 'libs/common/src/lib/pipes';
import { BlockquoteComponent } from '../blockquote';

@Component({
  selector: 'stf-agent-context',
  imports: [LineBreakFormatterPipe, TranslateModule, BlockquoteComponent, PaExpanderModule],
  templateUrl: './agent-context.component.html',
  styleUrl: './agent-context.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentContextComponent {
  context = input.required<AragAnswerContext>();
  heightUpdated = output();
}
