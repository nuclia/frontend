import { closeButtonConf, SisToastService } from './sis-toast.service';
import { ToastService } from '@guillotinaweb/pastanaga-angular';
import { MockService } from 'ng-mocks';

describe('SisToastService', () => {
  let service: SisToastService;
  let mockToastService: ToastService;
  const message = 'Toast message to be displayed';

  beforeEach(() => {
    mockToastService = MockService(ToastService);
    service = new SisToastService(mockToastService);

    jest.spyOn(mockToastService, 'openInfo');
    jest.spyOn(mockToastService, 'openSuccess');
    jest.spyOn(mockToastService, 'openWarning');
    jest.spyOn(mockToastService, 'openError');
  });

  it('should open info toast', () => {
    service.info(message);
    expect(mockToastService.openInfo).toHaveBeenCalledWith(message, { title: 'Information', icon: 'info' });
  });

  it('should open success toast', () => {
    service.success(message);
    expect(mockToastService.openSuccess).toHaveBeenCalledWith(message, { title: 'Success', icon: 'circle-check' });
  });

  it('should open warning toast', () => {
    service.warning(message);
    expect(mockToastService.openWarning).toHaveBeenCalledWith(message, {
      title: 'Warning',
      icon: 'warning',
      ...closeButtonConf,
    });
  });

  it('should open error toast', () => {
    service.error(message);
    expect(mockToastService.openError).toHaveBeenCalledWith(message, {
      title: 'Error',
      icon: 'circle-cross',
      ...closeButtonConf,
    });
  });
});
