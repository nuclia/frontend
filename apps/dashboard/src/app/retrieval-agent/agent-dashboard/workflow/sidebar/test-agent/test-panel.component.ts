import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { testAgentQuestion, testAgentRunning } from '../../workflow.state';
import { AgentBlockComponent, ChipComponent } from './elements';
import { TestPanelService } from './test-panel.service';

@Component({
  selector: 'app-test-panel',
  imports: [CommonModule, ReactiveFormsModule, PaButtonModule, PaTextFieldModule, ChipComponent, AgentBlockComponent],
  templateUrl: './test-panel.component.html',
  styleUrl: './test-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPanelComponent {
  private service = inject(TestPanelService);
  question = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  cancel = output();

  runningTest = testAgentRunning;
  runningQuestion = testAgentQuestion;

  triggerRun() {
    if (this.question.valid) {
      this.question.disable();
      this.service.runTest(this.question.getRawValue());
    }
  }

  triggerStop() {
    this.service.stopTest();
    this.question.enable();
  }
}
