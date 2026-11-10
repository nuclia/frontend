import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { toast } from '@spartan-ng/brain/sonner';
import { of } from 'rxjs';
import { CallbackNotifierService } from './callback-notifier.service';

describe('CallbackNotifierService', () => {
  afterEach(() => vi.restoreAllMocks());

  it('should show the translated message as an error toast', () => {
    const error = vi.spyOn(toast, 'error').mockImplementation(() => '');
    const translate = { get: vi.fn((key: string) => of(`translated ${key}`)) };
    TestBed.configureTestingModule({
      providers: [CallbackNotifierService, { provide: TranslateService, useValue: translate }],
    });

    TestBed.inject(CallbackNotifierService).error('login.error.oops');

    expect(error).toHaveBeenCalledWith('translated login.error.oops');
  });
});
