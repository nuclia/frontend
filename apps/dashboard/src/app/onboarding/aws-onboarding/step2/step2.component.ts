import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HelpCardComponent } from '@nuclia/sistema';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-step2',
  standalone: true,
  imports: [CommonModule, HelpCardComponent, ReactiveFormsModule, TranslateModule, PaButtonModule, PaTogglesModule],
  templateUrl: './step2.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step2Component {
  @Output() back = new EventEmitter<void>();
  @Output() next = new EventEmitter<{ choice: 'createKB' | 'inviteOwner' }>();

  form = new FormGroup({
    choice: new FormControl<'createKB' | 'inviteOwner' | null>(null, {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  submitChoice() {
    const data = this.form.getRawValue();
    if (data.choice !== null) {
      this.next.emit({ choice: data.choice });
    }
  }
}
