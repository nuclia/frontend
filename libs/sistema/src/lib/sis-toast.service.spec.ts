import { closeButtonConf, SisToastService } from './sis-toast.service';
import { ToastService } from '@guillotinaweb/pastanaga-angular';

describe('SisToastService', () => {
  let service: SisToastService;
  let mockToastService: ToastService;
  const message = 'Toast message to be displayed';

  beforeEach(() => {
    mockToastService = {
      openInfo: jest.fn(),
      openSuccess: jest.fn(),
      openWarning: jest.fn(),
      openError: jest.fn(),
    } as any as ToastService;
    service = new SisToastService(mockToastService);
  });

  it('should open info toast', () => {
    service.openInfo(message);
    expect(mockToastService.openInfo).toHaveBeenCalledWith(message, { title: 'Information', icon: 'info' });
  });

  it('should open success toast', () => {
    service.openSuccess(message);
    expect(mockToastService.openSuccess).toHaveBeenCalledWith(message, { title: 'Success', icon: 'circle-check' });
  });

  it('should open warning toast', () => {
    service.openWarning(message);
    expect(mockToastService.openWarning).toHaveBeenCalledWith(message, {
      title: 'Warning',
      icon: 'warning',
      ...closeButtonConf,
    });
  });

  it('should open error toast', () => {
    service.openError(message);
    expect(mockToastService.openError).toHaveBeenCalledWith(message, {
      title: 'Error',
      icon: 'circle-cross',
      ...closeButtonConf,
    });
  });
});
