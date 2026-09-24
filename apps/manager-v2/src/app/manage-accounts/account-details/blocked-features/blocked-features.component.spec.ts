import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ExtendedAccount } from '../../global-account.models';
import { AccountDetailsStore } from '../account-details.store';
import { BlockedFeaturesComponent } from './blocked-features.component';
import { FeatureNamePipe } from './feature-name.pipe';

describe('BlockedFeaturesComponent', () => {
  let component: BlockedFeaturesComponent;
  let fixture: ComponentFixture<BlockedFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockedFeaturesComponent, MockComponent(FormFooterComponent), MockPipe(FeatureNamePipe)],
      providers: [
        MockProvider(AccountDetailsStore, {
          getAccount: jest.fn(() => of({} as ExtendedAccount)),
        }),
        MockProvider(AccountService),
        MockProvider(ManagerStore, {
          blockedFeatures: of([]),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(BlockedFeaturesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
