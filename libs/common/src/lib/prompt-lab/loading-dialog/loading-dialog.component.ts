import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseModalComponent, PaButtonModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { ProgressBarComponent, SisProgressModule } from '../../../../../sistema/src/lib/progress';

@Component({
  selector: 'nsi-loading-dialog',
  standalone: true,
  imports: [CommonModule, PaButtonModule, TranslateModule, SisProgressModule, ProgressBarComponent],
  templateUrl: './loading-dialog.component.html',
  styleUrl: './loading-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingDialogComponent extends BaseModalComponent implements AfterViewInit {
  override ngAfterViewInit() {
    super.ngAfterViewInit();
  }
}
