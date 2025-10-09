import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BlockedFeaturesComponent } from './blocked-features.component';
import { MockComponent, MockModule, MockPipe, MockProvider } from 'ng-mocks';
import { AccountDetailsStore } from '../account-details.store';
import { AccountService } from '../../account.service';
import { of } from 'rxjs';
import { ExtendedAccount } from '../../global-account.models';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { ReactiveFormsModule } from '@angular/forms';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { FeatureNamePipe } from './feature-name.pipe';
import { ManagerStore } from '../../../manager.store';

describe('BlockedFeaturesComponent', () => {
  let component: BlockedFeaturesComponent;
  let fixture: ComponentFixture<BlockedFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MockModule(PaTogglesModule), MockModule(ReactiveFormsModule)],
      declarations: [BlockedFeaturesComponent, MockComponent(FormFooterComponent), MockPipe(FeatureNamePipe)],
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
