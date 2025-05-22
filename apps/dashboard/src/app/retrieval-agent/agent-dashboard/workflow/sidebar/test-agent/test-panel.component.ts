import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { Session } from '@nuclia/core';
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
export class TestPanelComponent implements OnInit {
  private service = inject(TestPanelService);
  question = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  session = new FormControl('new', { nonNullable: true, validators: [Validators.required] });

  cancel = output();

  sessions = signal<Session[]>([]);
  runningTest = testAgentRunning;
  runningQuestion = testAgentQuestion;

  ngOnInit(): void {
    this.service.getTestSessions().subscribe((sessions) => this.sessions.set(sessions));
  }

  triggerRun() {
    if (this.question.valid) {
      this.question.disable();
      this.service.runTest(this.question.getRawValue(), this.session.getRawValue());
    }
  }

  triggerStop() {
    this.service.stopTest();
    this.question.enable();
  }
}
