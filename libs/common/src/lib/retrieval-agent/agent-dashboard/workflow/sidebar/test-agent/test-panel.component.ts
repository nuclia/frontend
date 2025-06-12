import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, effect, inject, OnInit, output, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Session } from '@nuclia/core';
import { ProgressBarComponent } from '@nuclia/sistema';
import { testAgentAnswersByCategory, testAgentQuestion, testAgentRunning } from '../../workflow.state';
import { AgentBlockComponent, ChipComponent } from './elements';
import { TestPanelService } from './test-panel.service';

@Component({
  selector: 'app-test-panel',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PaButtonModule,
    PaTextFieldModule,
    ChipComponent,
    AgentBlockComponent,
    TranslateModule,
    ProgressBarComponent,
    PaTogglesModule,
  ],
  templateUrl: './test-panel.component.html',
  styleUrl: './test-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TestPanelComponent implements OnInit {
  private service = inject(TestPanelService);
  form = new FormGroup({
    question: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    session: new FormControl('new', { nonNullable: true, validators: [Validators.required] }),
    useWs: new FormControl(true, { nonNullable: true }),
  });

  get question() {
    return this.form.controls.question;
  }
  get session() {
    return this.form.controls.session;
  }
  get useWs() {
    return this.form.controls.useWs.getRawValue();
  }

  cancel = output();

  sessions = signal<Session[]>([]);
  runningTest = testAgentRunning;
  runningQuestion = testAgentQuestion;
  rawAnswers = testAgentAnswersByCategory;

  stopDisabled = computed(() => this.runningTest() === false || !this.useWs);

  constructor() {
    effect(() => {
      if (this.runningTest()) {
        this.form.disable();
      } else {
        this.form.enable();
      }
    });
  }

  ngOnInit(): void {
    this.service.getTestSessions().subscribe((sessions) => this.sessions.set(sessions));
  }

  triggerRun() {
    if (this.question.valid) {
      const question = this.question.getRawValue().trim();
      this.service.runTest(question, this.session.getRawValue(), this.useWs);
    }
  }

  triggerStop() {
    this.service.stopTest();
  }
}
