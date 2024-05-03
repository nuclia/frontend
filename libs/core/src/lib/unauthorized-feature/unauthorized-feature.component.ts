import { Component, inject, Input } from '@angular/core';
import { BadgeComponent, SisModalService } from '@nuclia/sistema';
import { UnauthorizedFeatureModalComponent } from './unauthorized-feature-modal.component';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-unauthorized-feature',
  standalone: true,
  imports: [BadgeComponent],
  template: `
    <nsi-badge
      icon="lock-filled"
      kind="tertiary"
      style="cursor: pointer"
      (click)="openFeaturesModal()"></nsi-badge>
  `,
})
export class UnauthorizedFeatureComponent {
  private modalService = inject(SisModalService);

  @Input({ required: true }) feature = '';

  openFeaturesModal() {
    this.modalService.openModal(
      UnauthorizedFeatureModalComponent,
      new ModalConfig({ data: { feature: this.feature } }),
    );
  }
}
