import { CommonModule } from '@angular/common';
import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseModalComponent, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarComponent, SisProgressModule } from '@nuclia/sistema';

@Component({
  selector: 'nsi-loading-dialog',
  imports: [CommonModule, PaButtonModule, TranslateModule, SisProgressModule, ProgressBarComponent],
  templateUrl: './loading-dialog.component.html',
  styleUrls: [
    '../../../../../pastanaga-angular/projects/pastanaga-angular/src/lib/modal/confirmation-dialog/confirmation-dialog.component.scss',
    './loading-dialog.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDialogComponent extends BaseModalComponent implements AfterViewInit {
  override ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
