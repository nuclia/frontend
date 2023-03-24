import { AfterViewInit, ChangeDetectionStrategy, Component } from '@angular/core';
import { BaseModalComponent } from '@guillotinaweb/pastanaga-angular';

@Component({
  templateUrl: './loading-modal.component.html',
  styleUrls: ['./loading-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingModalComponent extends BaseModalComponent implements AfterViewInit {
  override ngAfterViewInit(): void {
    if (!!this.ref) {
      this.id = this.ref.id;
      this.config = this.ref.config;
    }
  }
}
