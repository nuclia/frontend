import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { PaModalModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/modal/modal.module';
import { PaTextFieldModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/controls/textfield/text-field.module';
import { PaDropdownModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/dropdown/dropdown.module';
import { PaButtonModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/button/button.module';

@Component({
    templateUrl: './modal-example.component.html',
    styleUrls: ['./modal-example.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PaModalModule,
        PaTextFieldModule,
        PaDropdownModule,
        PaButtonModule,
    ],
})
export class ModalExampleComponent {
  constructor(public modal: ModalRef) {}
}
