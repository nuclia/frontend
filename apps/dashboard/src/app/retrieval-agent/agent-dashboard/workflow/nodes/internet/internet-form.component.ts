import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';

@Component({
  selector: 'app-internet-form',
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTextFieldModule, ConfigurationFormComponent],
  templateUrl: './internet-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetFormComponent extends FormDirective {
  override form = new FormGroup({
    internet: new FormGroup({}),
  });
  override get configForm() {
    return this.form.controls.internet;
  }
}
