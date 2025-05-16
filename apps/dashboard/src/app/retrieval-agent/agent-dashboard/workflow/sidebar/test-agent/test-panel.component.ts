import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, output } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { runTest, stopTest, testAgentRunning } from '../../workflow.state';

@Component({
  selector: 'app-test-panel',
  imports: [CommonModule, ReactiveFormsModule, PaButtonModule, PaTextFieldModule],
  templateUrl: './test-panel.component.html',
  styleUrl: './test-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPanelComponent {
  question = new FormControl('', { nonNullable: true, validators: [Validators.required] });

  cancel = output();

  runningTest = testAgentRunning;

  triggerRun() {
    if (this.question.valid) {
      this.question.disable();
      runTest(this.question.getRawValue());
    }
  }

  triggerStop() {
    stopTest();
    this.question.enable();
  }
}
