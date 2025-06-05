import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AragAnswerContext } from '@nuclia/core';
import { LineBreakFormatterPipe } from 'libs/common/src/lib/pipes';
import { BlockquoteComponent } from '../blockquote';

@Component({
  selector: 'stf-agent-context',
  imports: [CommonModule, LineBreakFormatterPipe, TranslateModule, BlockquoteComponent],
  templateUrl: './agent-context.component.html',
  styleUrl: './agent-context.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentContextComponent {
  context = input.required<AragAnswerContext>();
}
