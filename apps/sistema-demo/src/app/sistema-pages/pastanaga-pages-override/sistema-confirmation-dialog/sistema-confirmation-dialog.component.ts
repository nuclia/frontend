import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SisModalService } from '@nuclia/sistema';

@Component({
  selector: 'nsd-sistema-confirmation-dialog',
  templateUrl: './sistema-confirmation-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SistemaConfirmationDialogComponent {
  openConfirmCode = `
  constructor(private sisModalService: SisModalService) {}

  openConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this?',
      description: 'Default buttons are cancel and confirm but you can pass any label you want.',
    });
  }

  openDestructiveConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this destructive action?',
      description: 'For negative/destructive actions, you can use isDestructive option.',
      isDestructive: true,
    });
  }

  openSolidCancelConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this?',
      description: 'Default buttons are cancel and confirm but you can pass any label you want.',
      cancelAspect: 'solid',
    });
  }
}`;

  constructor(private modalService: SisModalService) {}

  openConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this?',
      description: 'Default buttons are cancel and confirm but you can pass any label you want.',
    });
  }

  openDestructiveConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this destructive action?',
      description: 'For negative/destructive actions, you can use isDestructive option.',
      isDestructive: true,
    });
  }

  openSolidCancelConfirm() {
    this.modalService.openConfirm({
      title: 'Are you sure you want to do this?',
      description: 'Default buttons are cancel and confirm but you can pass any label you want.',
      cancelAspect: 'solid',
    });
  }
}
