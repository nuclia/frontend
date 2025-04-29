import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output, ViewEncapsulation } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-configuration-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaButtonModule, PaTextFieldModule],
  templateUrl: './configuration-form.component.html',
  styleUrl: './configuration-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ConfigurationFormComponent {
  form = input.required<FormGroup>();

  headerHeight = input();
  triggerSubmit = output();
  cancel = output();

  onSubmit() {
    if (this.form().valid) {
      this.triggerSubmit.emit();
    }
  }
}
