import { ChangeDetectionStrategy, ChangeDetectorRef, Component } from '@angular/core';
import { Router } from '@angular/router';
import { SDKService } from '@flaps/core';
import { filter, take } from 'rxjs';
import { SyncService } from '../sync/sync.service';

@Component({
  selector: 'nde-main-layout',
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainLayoutComponent {
  isLogged = false;
  steps = ['upload.steps.source', 'upload.steps.configure', 'upload.steps.data', 'upload.steps.destination'];
  constructor(
    private router: Router,
    private sync: SyncService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    this.sdk.nuclia.auth
      .isAuthenticated()
      .pipe(
        filter((yes) => yes),
        take(1),
      )
      .subscribe(() => {
        if (!this.sync.getAccountId()) {
          this.router.navigate(['/select']);
        }
        this.isLogged = true;
        this.cdr?.markForCheck();
      });
  }

  goTo(step: number) {
    this.sync.step.pipe(take(1)).subscribe((currentStep) => {
      if (step < currentStep) {
        this.sync.setStep(step);
      }
    });
  }
}
