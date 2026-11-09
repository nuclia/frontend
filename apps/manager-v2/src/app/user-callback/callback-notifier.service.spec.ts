import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { UiToastService } from '@nuclia/ui/toast';
import { of } from 'rxjs';
import { CallbackNotifierService } from './callback-notifier.service';

describe('CallbackNotifierService', () => {
  it('should show the translated message as an error toast', () => {
    const toast = { error: vi.fn() };
    const translate = { get: vi.fn((key: string) => of(`translated ${key}`)) };
    TestBed.configureTestingModule({
      providers: [
        CallbackNotifierService,
        { provide: UiToastService, useValue: toast },
        { provide: TranslateService, useValue: translate },
      ],
    });

    TestBed.inject(CallbackNotifierService).error('login.error.oops');

    expect(toast.error).toHaveBeenCalledWith('translated login.error.oops');
  });
});
