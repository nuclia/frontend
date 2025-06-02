import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-conditional-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    ConfigurationFormComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './conditional-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConditionalFormComponent extends FormDirective {
  override form = new FormGroup({
    conditional: new FormGroup({
      prompt: new FormControl<string>('', { nonNullable: true }),
    }),
  });
  override get configForm() {
    return this.form.controls.conditional;
  }
}
