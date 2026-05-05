import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { UploadDialogService, UploadType } from '../../resources/upload-button/upload-dialog.service';
import { filter } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { NavigationService, UploadEventService } from '@flaps/core';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class UploadDataComponent {
  private navigationService = inject(NavigationService);
  private uploadEventService = inject(UploadEventService);

  kbUrl = toSignal(this.navigationService.kbUrl, { initialValue: '' });
  uploadStarted = signal(false);
  isOnboardingActive = toSignal(this.uploadEventService.onboardingActive$, { initialValue: false });

  constructor(
    private uploadService: UploadDialogService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  selectUpload(type: UploadType) {
    this.uploadService
      .upload(type)
      .onClose.pipe(filter((data) => !data || !data.cancel))
      .subscribe(() => {
        if (this.isOnboardingActive()) {
          this.uploadStarted.set(true);
          this.uploadEventService.notifyProcessingStarted();
        } else {
          this.router.navigate(['../resources/pending'], { relativeTo: this.route });
        }
      });
  }
}
