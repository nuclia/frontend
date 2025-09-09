import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ExpandableTextareaComponent } from '@nuclia/sistema';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-summarize-form',
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    ExpandableTextareaComponent,
  ],
  templateUrl: './summarize-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SummarizeFormComponent extends FormDirective {
  override form = new FormGroup({
    summarize: new FormGroup({
      prompt: new FormControl('', { nonNullable: true }),
      images: new FormControl(false),
      conversational: new FormControl(false),
    }),
  });
  override get configForm() {
    return this.form.controls.summarize;
  }
}
