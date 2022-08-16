import { SisModalService } from './sis-modal.service';
import { MockService } from 'ng-mocks';
import { ModalConfig, ModalRef, ModalService } from '@guillotinaweb/pastanaga-angular';
import { Component } from '@angular/core';

@Component({
  template: `<pa-modal-dialog>
    <pa-modal-title>Dialog title</pa-modal-title>
    <pa-modal-description>Dialog description</pa-modal-description>
  </pa-modal-dialog>`,
})
export class TestDialogComponent {
  constructor(public modal: ModalRef) {}
}

describe('SisModalService', () => {
  let paModalServiceMock: ModalService;
  let service: SisModalService;

  const defaultConf = { title: 'Confirm title' };

  beforeEach(() => {
    paModalServiceMock = MockService(ModalService);
    service = new SisModalService(paModalServiceMock);

    jest.spyOn(paModalServiceMock, 'openConfirm');
    jest.spyOn(paModalServiceMock, 'openModal');
  });

  describe('openConfirm', () => {
    it('should call pastanaga openConfirm method with basic cancelAspect by default', () => {
      service.openConfirm(defaultConf);
      expect(paModalServiceMock.openConfirm).toHaveBeenCalledWith({
        title: defaultConf.title,
        cancelAspect: 'basic',
      });
    });

    it('should call pastanaga openConfirm method with provided cancelAspect', () => {
      service.openConfirm({ ...defaultConf, cancelAspect: 'solid' });
      expect(paModalServiceMock.openConfirm).toHaveBeenCalledWith({
        title: defaultConf.title,
        cancelAspect: 'solid',
      });
    });
  });

  describe('openModal', () => {
    it('should call pastanaga openModal', () => {
      service.openModal(TestDialogComponent);
      expect(paModalServiceMock.openModal).toHaveBeenCalledWith(TestDialogComponent, undefined);
    });

    it('should call pastanaga openModal with provided config', () => {
      const config: ModalConfig = { dismissable: false, data: { some: 'data' } };
      service.openModal(TestDialogComponent, config);
      expect(paModalServiceMock.openModal).toHaveBeenCalledWith(TestDialogComponent, config);
    });
  });
});
