import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { PaExpanderModule } from '@guillotinaweb/pastanaga-angular';
import { AragAnswerStep } from '@nuclia/core';
import { LineBreakFormatterPipe } from 'libs/common/src/lib/pipes';
import { getFormattedCost } from '../../../../../../arag.utils';
import { BlockquoteComponent } from '../blockquote';
import { ChipComponent } from '../chip';

@Component({
  selector: 'stf-agent-step',
  imports: [ChipComponent, LineBreakFormatterPipe, BlockquoteComponent, PaExpanderModule],
  templateUrl: './agent-step.component.html',
  styleUrl: './agent-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentStepComponent {
  step = input.required<AragAnswerStep>();
  heightUpdated = output();

  formattedCost = computed(() => {
    const input = this.step().input_nuclia_tokens ?? undefined;
    const output = this.step().output_nuclia_tokens ?? undefined;
    const timing = this.step().timeit ?? undefined;
    return getFormattedCost(timing, input, output);
  });
}
