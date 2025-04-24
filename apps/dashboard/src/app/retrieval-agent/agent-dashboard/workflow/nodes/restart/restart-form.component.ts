import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';
import { RestartAgentUI } from '../../workflow.models';

@Component({
  selector: 'app-restart-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    ConfigurationFormComponent,
  ],
  templateUrl: './restart-form.component.html',
  styleUrl: './restart-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RestartFormComponent extends FormDirective implements OnInit {
  override form = new FormGroup({
    restart: new FormGroup({
      prompt: new FormControl('', { validators: Validators.required, nonNullable: true }),
      retries: new FormControl<number>(0, {
        validators: [Validators.required, Validators.pattern('^[0-9]*$')],
        nonNullable: true,
      }),
      rules: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
    }),
  });
  override get configForm() {
    return this.form.controls.restart;
  }

  get rules() {
    return this.configForm.controls.rules;
  }

  ngOnInit() {
    if (this.config) {
      const config = this.config as RestartAgentUI;
      if (config.rules.length > 1) {
        // Add rules control to the form to display all the rules already stored
        for (let i = 0; i < config.rules.length - 1; i++) {
          this.addRule();
        }
        this.rules.patchValue(config.rules);
      }
    }
  }

  override submit() {
    if (this.form.valid) {
      const config = this.configForm.getRawValue();
      // Don't save empty rules
      config.rules = config.rules.filter((rule) => !!rule);
      this.submitForm.emit(config);
    }
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }
}
