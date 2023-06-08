import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UploadDialogService, UploadType } from './upload-dialog.service';
import { FeatureFlagService } from '@flaps/core';
import { shareReplay } from 'rxjs/operators';

@Component({
  selector: 'stf-upload-button',
  templateUrl: './upload-button.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UploadButtonComponent implements OnInit {
  isQnAEnabled = this.feature.isFeatureEnabled('upload-q-and-a').pipe(shareReplay(1));

  constructor(private uploadService: UploadDialogService, private feature: FeatureFlagService) {}

  ngOnInit(): void {}

  upload(type: UploadType) {
    this.uploadService.upload(type);
  }
}
