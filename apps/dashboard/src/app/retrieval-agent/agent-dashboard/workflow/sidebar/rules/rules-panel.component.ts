import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ConfigurationFormComponent } from '../../basic-elements';

@Component({
  selector: 'app-rules-panel',
  imports: [CommonModule, ConfigurationFormComponent, ReactiveFormsModule],
  templateUrl: './rules-panel.component.html',
  styleUrl: './rules-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RulesPanelComponent {
  form = new FormGroup({
    config: new FormGroup({}),
  });

  get configForm() {
    return this.form.controls.config;
  }

  submit() {
    throw new Error('Method not implemented.');
  }
  cancel() {
    throw new Error('Method not implemented.');
  }
}
