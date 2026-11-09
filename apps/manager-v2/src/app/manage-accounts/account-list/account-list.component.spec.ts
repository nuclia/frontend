import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiConfirmService } from '@nuclia/ui/confirm-dialog';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { AccountSummary } from '../account-ui.models';
import { AccountService } from '../account.service';
import { AccountListComponent } from './account-list.component';

describe('AccountListComponent', () => {
  let component: AccountListComponent;
  let fixture: ComponentFixture<AccountListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountListComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService, {
          getAccounts: vi.fn(() =>
            of([
              {
                id: 'a2',
                title: 'Zed',
                slug: 'zed',
                email: 'z@nuclia.com',
                type: 'stash-trial',
                workflow: 'classic',
                created: '2024-01-01T00:00:00',
              },
              {
                id: 'a1',
                title: 'Acme',
                slug: 'acme',
                email: 'a@nuclia.com',
                type: 'stash-trial',
                workflow: 'classic',
                created: '2024-01-01T00:00:00',
              },
              {
                id: 'a3',
                title: 'Corp',
                slug: 'corp',
                email: 'c@nuclia.com',
                type: 'v3enterprise',
                workflow: 'classic',
                created: '2024-01-01T00:00:00',
              },
            ] as AccountSummary[]),
          ),
        }),
        MockProvider(UiConfirmService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canDeleteAccount: signal(true),
          canCreateAccount: signal(true),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should sort accounts by type then title and filter them', () => {
    expect(component.accounts().map((account) => account.id)).toEqual(['a1', 'a2', 'a3']);
    component.filter.set('corp');
    expect(component.accounts().map((account) => account.id)).toEqual(['a3']);
  });
});
