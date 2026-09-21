import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaDropdownModule, PaPopupModule } from '@guillotinaweb/pastanaga-angular';
import { UploadDialogService, UploadType } from './upload-dialog.service';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TranslateModule, PaButtonModule, PaDropdownModule, PaPopupModule],
})
export class UploadButtonComponent {
  constructor(private uploadService: UploadDialogService) {}

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
