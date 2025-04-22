import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, input, OnInit, output } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { SisToastService } from '@nuclia/sistema';
import { switchMap } from 'rxjs';
import { ConfigurationFormComponent } from '../../basic-elements';

@Component({
  selector: 'app-rules-panel',
  imports: [
    CommonModule,
    ConfigurationFormComponent,
    PaButtonModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './rules-panel.component.html',
  styleUrl: './rules-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesPanelComponent implements OnInit {
  private sdk = inject(SDKService);
  private toaster = inject(SisToastService);
  private translate = inject(TranslateService);

  form = new FormGroup({
    config: new FormGroup({
      rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    }),
  });
  headerHeight = input<string>('');
  cancel = output();

  get configForm() {
    return this.form.controls.config;
  }

  get rulesArray() {
    return this.configForm.controls.rules;
  }
  get rules() {
    return this.rulesArray.controls;
  }

  ngOnInit(): void {
    this.sdk.currentArag.pipe(switchMap((arag) => arag.getRules())).subscribe({
      next: (rules) => {
        rules.forEach((rule) => this.addRule(typeof rule === 'string' ? rule : rule.prompt));
      },
      error: () => {
        this.toaster.error(this.translate.instant('retrieval-agents.workflow.sidebar.rules.errors.get-rules'));
      },
    });
  }

  addRule(rule?: string) {
    this.rulesArray.push(new FormControl<string>(rule || '', { nonNullable: true }));
  }
  removeRule(index: number) {
    this.rulesArray.removeAt(index);
  }

  submit() {
    const rules: string[] = this.rulesArray.getRawValue();
    this.sdk.currentArag.pipe(switchMap((arag) => arag.setRules(rules))).subscribe({
      next: () => {
        this.sdk.refreshCurrentArag();
      },
      error: () => {
        this.toaster.error(this.translate.instant('retrieval-agents.workflow.sidebar.rules.errors.set-rules'));
      },
    });
  }
}
