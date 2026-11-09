import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterModule } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { KbDetailsComponent } from './kb-details.component';

describe('KbDetailsComponent', () => {
  let component: KbDetailsComponent;
  let fixture: ComponentFixture<KbDetailsComponent>;
  const canEdit = signal(true);

  beforeEach(async () => {
    canEdit.set(true);
    await TestBed.configureTestingModule({
      imports: [KbDetailsComponent, RouterModule.forRoot([])],
      providers: [
        MockProvider(AccountService),
        MockProvider(UserService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit,
          canSeeUsers: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
          kbDetails: signal(null),
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(KbDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should enable and disable editable controls when edit permission changes', () => {
    const { slug, title, prewarm_enabled } = component.kbForm.controls;
    expect([slug, title, prewarm_enabled].every((control) => control.enabled)).toBe(true);

    canEdit.set(false);
    fixture.detectChanges();
    expect([slug, title, prewarm_enabled].every((control) => control.disabled)).toBe(true);

    canEdit.set(true);
    fixture.detectChanges();
    expect([slug, title, prewarm_enabled].every((control) => control.enabled)).toBe(true);
  });
});
