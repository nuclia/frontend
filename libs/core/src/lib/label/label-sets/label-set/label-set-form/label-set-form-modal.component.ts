import { ChangeDetectionStrategy, Component } from '@angular/core';

import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { LabelSetFormComponent } from './label-set-form.component';
import { TranslateModule } from '@ngx-translate/core';
import { LabelSetKind } from '@nuclia/core';

@Component({
  selector: 'stf-label-set-form-modal',
  imports: [PaModalModule, LabelSetFormComponent, TranslateModule],
  templateUrl: './label-set-form-modal.component.html',
  styleUrl: './label-set-form-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabelSetFormModalComponent {
  constructor(public modal: ModalRef<{ kind?: LabelSetKind }>) {}
}
