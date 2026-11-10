import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { toast } from '@spartan-ng/brain/sonner';
import { MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
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
          publishKb: vi.fn(() => of({})),
        }),
        MockProvider(UserService),
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

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

  it('should not flag the kb as saving when there is nothing to save', () => {
    const vm = getVm();
    Object.assign(vm, { backupKb: undefined });

    vm.save();

    expect(vm.isSaving()).toBe(false);
    expect(accountService.updateKb).not.toHaveBeenCalled();
  });

  it('should stop saving and notify when the update fails', () => {
    vi.spyOn(toast, 'error').mockImplementation(() => '');
    vi.mocked(accountService.updateKb).mockReturnValueOnce(throwError(() => new Error('boom')));
    const vm = getVm();

    vm.save();

    expect(vm.isSaving()).toBe(false);
    expect(toast.error).toHaveBeenCalledWith('Updating knowledge box failed');
  });

  it('should restore title, slug, zone and prewarm on reset', () => {
    const vm = getVm();
    vm.kbForm.patchValue({ title: 'Changed', slug: 'changed', zone: 'Other', prewarm_enabled: true });

    vm.reset();

    expect(vm.kbForm.getRawValue()).toEqual({ slug: 'my-kb', title: 'My KB', zone: 'Europe', prewarm_enabled: false });
    expect(vm.kbForm.pristine).toBe(true);
  });

  it('should toggle the publication and notify when it fails', () => {
    vi.spyOn(toast, 'error').mockImplementation(() => '');
    const setKbDetails = vi.spyOn(TestBed.inject(ManagerStore), 'setKbDetails');
    const vm = getVm();

    vm.togglePublish();
    expect(accountService.publishKb).toHaveBeenCalledWith(KB, true);
    expect(setKbDetails).toHaveBeenCalledWith({ ...KB, published: true });

    setKbDetails.mockClear();
    vi.mocked(accountService.publishKb).mockReturnValueOnce(throwError(() => new Error('boom')));
    vm.togglePublish();
    expect(setKbDetails).not.toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Updating the publication status failed');
  });

  describe('copy', () => {
    afterEach(() => {
      vi.useRealTimers();
      vi.unstubAllGlobals();
    });

    it('should flag the text as copied for a second', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => Promise.resolve()) } });
      const vm = getVm();

      vm.copy(false);
      expect(vm.copied()).toBe(false);
      await vi.advanceTimersByTimeAsync(0);
      expect(vm.copied()).toBe(true);

      await vi.advanceTimersByTimeAsync(1000);
      expect(vm.copied()).toBe(false);
    });

    it('should notify and not flag the text as copied when the clipboard is not available', async () => {
      vi.spyOn(toast, 'error').mockImplementation(() => '');
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => Promise.reject(new Error('denied'))) } });
      const vm = getVm();

      vm.copy(false);
      await Promise.resolve();
      await Promise.resolve();

      expect(vm.copied()).toBe(false);
      expect(toast.error).toHaveBeenCalledWith('Copying to the clipboard failed');
    });

    it('should clear the pending timer when the component is destroyed', async () => {
      vi.useFakeTimers();
      vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn(() => Promise.resolve()) } });
      const vm = getVm();
      vm.copy(false);
      await vi.advanceTimersByTimeAsync(0);

      fixture.destroy();
      await vi.advanceTimersByTimeAsync(1000);

      expect(vm.copied()).toBe(true);
    });
  });

  it('should list the members and change a member role', () => {
    const rows = Array.from(fixture.nativeElement.querySelectorAll('tbody tr')) as HTMLElement[];
    expect(rows.map((row) => row.querySelectorAll('td')[3].textContent?.trim())).toEqual([
      'owner',
      'contributor',
      'member',
    ]);
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
