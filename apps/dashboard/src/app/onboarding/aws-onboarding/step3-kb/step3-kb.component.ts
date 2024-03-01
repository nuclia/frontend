import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HelpCardComponent } from '@nuclia/sistema';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'app-step3-kb',
  standalone: true,
  imports: [CommonModule, FormsModule, HelpCardComponent, ReactiveFormsModule, TranslateModule, PaButtonModule],
  templateUrl: './step3-kb.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step3KbComponent {
  @Output() back = new EventEmitter<void>();

  form = new FormGroup({});

  createKb() {
    // TODO
  }
}
