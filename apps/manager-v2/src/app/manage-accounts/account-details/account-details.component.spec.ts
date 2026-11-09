import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { BackendConfigurationService, FeaturesService } from '@flaps/core';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../manager.store';
import { ZoneService } from '../../manage-zones/zone.service';
import { AccountService } from '../account.service';
import { AccountDetailsComponent } from './account-details.component';

describe('AccountDetailsComponent', () => {
  let component: AccountDetailsComponent;
  let fixture: ComponentFixture<AccountDetailsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService),
        MockProvider(ZoneService, {
          loadZones: vi.fn(() => of([])),
        }),
        MockProvider(FeaturesService, {
          isTrial: of(false),
        }),
        MockProvider(BackendConfigurationService),
        MockProvider(ManagerStore, {
          canSeeUsers: signal(true),
          canAccessKBs: signal(true),
          kbList: signal([]),
          accountDetails: signal(null),
          projectList: signal([]),
          canAccessProjects: signal(true),
          currentState: signal(''),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AccountDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
