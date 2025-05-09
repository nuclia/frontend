import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, OnInit, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { NodeConfig } from '../../workflow.models';

@Component({
  selector: 'app-rules-field',
  imports: [CommonModule, ReactiveFormsModule, ExpandableTextareaComponent, PaButtonModule, TranslateModule],
  templateUrl: './rules-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RulesFieldComponent implements OnInit {
  /**
   * Required form group containing a FormArray control named "rules": FormGroup<{ rules: FormArray<FormControl<string>> }>
   */
  form = input.required<FormGroup>();
  /**
   * Saved config to properly initialise rules
   */
  config = input<NodeConfig>();

  get rules(): FormArray<FormControl<string>> {
    return this.form().controls['rules'] as FormArray<FormControl<string>>;
  }

  ngOnInit() {
    const config = this.config();
    if (config?.rules) {
      if (config.rules.length > 1) {
        // Add rules control to the form to display all the rules already stored
        for (let i = 0; i < config.rules.length - 1; i++) {
          this.addRule();
        }
        this.rules.patchValue(config.rules);
      }
    }
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }
}
