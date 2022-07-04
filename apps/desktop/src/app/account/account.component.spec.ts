import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { SDKService } from '@flaps/core';
import { of } from 'rxjs';
import { SyncService } from '../sync/sync.service';

import { SelectAccountComponent } from './account.component';

describe('SelectAccountComponent', () => {
  let component: SelectAccountComponent;
  let fixture: ComponentFixture<SelectAccountComponent>;
  let sync: SyncService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SelectAccountComponent],
      imports: [RouterTestingModule],
      providers: [
        { provide: SyncService, useValue: { selectAccount: jest.fn() } },
        {
          provide: SDKService,
          useValue: {
            nuclia: { db: { getAccounts: () => of([{ slug: 'account1', title: 'Account 1' }]) } },
          },
        },
      ],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SelectAccountComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    sync = TestBed.inject(SyncService);
  });

  it('should select account', () => {
    const element = fixture.debugElement.nativeElement.querySelector('li');
    element.click();
    expect(sync.selectAccount).toHaveBeenCalledWith('account1');
  });
});
