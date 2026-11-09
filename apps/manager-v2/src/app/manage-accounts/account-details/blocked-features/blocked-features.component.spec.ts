import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockComponent, MockPipe, MockProvider } from 'ng-mocks';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { BlockedFeaturesComponent } from './blocked-features.component';
import { FeatureNamePipe } from './feature-name.pipe';

describe('BlockedFeaturesComponent', () => {
  let component: BlockedFeaturesComponent;
  let fixture: ComponentFixture<BlockedFeaturesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BlockedFeaturesComponent, MockComponent(FormFooterComponent), MockPipe(FeatureNamePipe)],
      providers: [
        MockProvider(AccountService),
        MockProvider(ManagerStore, {
          blockedFeatures: signal([]),
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
