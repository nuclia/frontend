import { Injectable, Type } from '@angular/core';
import { ConfirmationData, ModalConfig, ModalRef, ModalService } from '@guillotinaweb/pastanaga-angular';

@Injectable({
  providedIn: 'root',
})
export class SisModalService {
  constructor(private paModalService: ModalService) {}

  openConfirm(data: ConfirmationData): ModalRef {
    return this.paModalService.openConfirm({
      ...data,
      cancelAspect: data.cancelAspect || 'basic',
    });
  }

  openModal(component: Type<any>, config?: ModalConfig): ModalRef {
    return this.paModalService.openModal(component, config);
  }
}
