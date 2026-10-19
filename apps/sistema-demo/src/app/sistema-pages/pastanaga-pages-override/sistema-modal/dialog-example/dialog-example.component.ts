import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ModalRef } from '@guillotinaweb/pastanaga-angular';
import { PaModalModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/modal/modal.module';
import { PaTextFieldModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/controls/textfield/text-field.module';
import { PaButtonModule } from '../../../../../../../../libs/pastanaga-angular/projects/pastanaga-angular/src/lib/button/button.module';

@Component({
    templateUrl: './dialog-example.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        PaModalModule,
        PaTextFieldModule,
        PaButtonModule,
    ],
})
export class DialogExampleComponent {
  constructor(public modal: ModalRef) {}
}
