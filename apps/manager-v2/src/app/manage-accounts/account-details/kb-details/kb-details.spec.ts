import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { UiToastService } from '@nuclia/ui/toast';
import { MockProvider } from 'ng-mocks';
import { of } from 'rxjs';
import { UserService } from '../../../manage-users/user.service';
import { ManagerStore } from '../../../manager.store';
import { KbDetails, KbUser } from '../../account-ui.models';
import { AccountService } from '../../account.service';
import { ACCOUNT_DETAILS } from '../../test-utils';
import { KbDetailsComponent } from './kb-details.component';
import { KbDetailsService } from './kb-details.service';
import { getCopyText, getUserRows } from './kb-details.utils';

const user = (id: string, role: KbUser['role']): KbUser => ({ id, name: `Name ${id}`, email: `${id}@test.io`, role });

const KB: KbDetails = {
  id: 'kb-1',
  slug: 'my-kb',
  title: 'My KB',
  accountId: 'account-1',
  zone: { id: 'zone-1', slug: 'europe-1', title: 'Europe' },
  created: '2025-01-01',
  owners: [user('o1', 'SOWNER')],
  contributors: [user('c1', 'SCONTRIBUTOR')],
  members: [user('m1', 'SMEMBER')],
  prewarm_enabled: false,
  published: false,
} as KbDetails;

describe('KbDetails', () => {
  let fixture: ComponentFixture<KbDetailsComponent>;
  let accountService: AccountService;
  const canEdit = signal(true);
  const kbDetails = signal<KbDetails | null>(KB);

  beforeEach(async () => {
    canEdit.set(true);
    await TestBed.configureTestingModule({
      imports: [KbDetailsComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { params: of({ kbId: 'kb-1', zoneId: 'zone-1' }) } },
        MockProvider(AccountService, {
          loadKb: vi.fn(() => of(KB)),
          updateKb: vi.fn(() => of(KB)),
          updateKbUser: vi.fn(() => of(KB)),
        }),
        MockProvider(UserService),
        MockProvider(UiToastService),
        MockProvider(ManagerStore, {
          canEdit,
          canSeeUsers: signal(true),
          accountDetails: signal(ACCOUNT_DETAILS),
          kbDetails,
        }),
      ],
    }).compileComponents();

    accountService = TestBed.inject(AccountService);
    fixture = TestBed.createComponent(KbDetailsComponent);
    fixture.detectChanges();
  });

  const getVm = () => fixture.debugElement.injector.get(KbDetailsService);

  it('should enable and disable editable controls when edit permission changes', () => {
    const { slug, title, prewarm_enabled } = getVm().kbForm.controls;
    expect([slug, title, prewarm_enabled].every((control) => control.enabled)).toBe(true);

    canEdit.set(false);
    fixture.detectChanges();
    expect([slug, title, prewarm_enabled].every((control) => control.disabled)).toBe(true);

    canEdit.set(true);
    fixture.detectChanges();
    expect([slug, title, prewarm_enabled].every((control) => control.enabled)).toBe(true);
  });

  it('should load the kb into the form and save the changes', () => {
    const vm = getVm();
    expect(vm.kbForm.getRawValue()).toEqual({ slug: 'my-kb', title: 'My KB', zone: 'Europe', prewarm_enabled: false });

    vm.kbForm.controls.title.setValue('New title');
    vm.save();

    expect(accountService.updateKb).toHaveBeenCalledWith(KB, expect.objectContaining({ title: 'New title' }));
    expect(vm.kbForm.pristine).toBe(true);
  });

  it('should list the members and change a member role', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    expect(rows.map((row) => row.querySelectorAll('td')[3].textContent?.trim())).toEqual([
      'owner',
      'contributor',
      'member',
    ]);
    // The last owner cannot be edited
    expect(rows[0].querySelector('button')).toBeNull();
    expect(rows[1].querySelector('button')).not.toBeNull();

    getVm().updateUserRole(KB.members[0], 'SOWNER');
    expect(accountService.updateKbUser).toHaveBeenCalledWith(KB, 'm1', 'SOWNER');
  });

  describe('utils', () => {
    it('should order the user rows by role', () => {
      expect(getUserRows(KB).map((row) => row.role)).toEqual(['owner', 'contributor', 'member']);
    });

    it('should build the text to copy', () => {
      expect(getCopyText(KB, false)).toBe('kb-1');
      expect(getCopyText(KB, true)).toBe('Account: account-1\nZone: europe-1\nKB: kb-1');
    });
  });
});
