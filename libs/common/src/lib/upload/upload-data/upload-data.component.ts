import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NavigationService, UploadEventService } from '@flaps/core';
import { PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { UploadDialogService, UploadType } from '../../resources/upload-button/upload-dialog.service';
import { ResourceHandlingBannerComponent } from '../resource-handling-banner/resource-handling-banner.component';
import { UploadOptionComponent } from './upload-option/upload-option.component';

@Component({
  selector: 'stf-upload-data',
  templateUrl: './upload-data.component.html',
  styleUrls: ['./upload-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ResourceHandlingBannerComponent,
    UploadOptionComponent,
    InfoCardComponent,
    PaButtonModule,
    RouterLink,
    TranslatePipe,
  ],
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
      .onClose.pipe(filter((data) => !data?.cancel))
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
