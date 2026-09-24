import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FeaturesService } from '@flaps/core';
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
  constructor(
    private uploadService: UploadDialogService,
    private features: FeaturesService,
  ) {}

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
