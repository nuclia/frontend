import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';

@Component({
  selector: 'app-rules-field',
  imports: [CommonModule, ReactiveFormsModule, ExpandableTextareaComponent, PaButtonModule, TranslateModule],
  templateUrl: './rules-field.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class RulesFieldComponent {
  /**
   * Required form group containing a FormArray control named "rules": FormGroup<{ rules: FormArray<FormControl<string>> }>
   */
  form = input.required<FormGroup>();

  get rules(): FormArray<FormControl<string>> {
    return this.form().controls['rules'] as FormArray<FormControl<string>>;
  }

  addRule() {
    this.rules.push(new FormControl<string>('', { nonNullable: true }));
  }

  removeRule(index: number) {
    this.rules.removeAt(index);
  }
}
