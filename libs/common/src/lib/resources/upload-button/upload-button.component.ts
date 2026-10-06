import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { UploadDialogService, UploadType } from './upload-dialog.service';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PaButtonModule, PaPopupModule, PaDropdownModule, TranslatePipe],
})
export class UploadButtonComponent {
  private uploadService = inject(UploadDialogService);

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
