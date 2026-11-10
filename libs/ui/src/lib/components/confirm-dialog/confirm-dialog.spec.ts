import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { HlmDialogService } from '@nuclia/ui-spartan/dialog';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { firstValueFrom, Subject } from 'rxjs';
import { UiConfirmData, UiConfirmDialog } from './confirm-dialog.component';
import { UiConfirmService } from './confirm.service';

describe('Confirm dialog', () => {
  describe('UiConfirmDialog', () => {
    const close = vi.fn();

    function render(data: UiConfirmData) {
      TestBed.configureTestingModule({
        imports: [UiConfirmDialog],
        providers: [
          { provide: DIALOG_DATA, useValue: data },
          {
            provide: BrnDialogRef,
            useValue: { close, dialogId: 'test', registerDescription: vi.fn(), unregisterDescription: vi.fn() },
          },
        ],
      });
      const fixture = TestBed.createComponent(UiConfirmDialog);
      fixture.detectChanges();
      return fixture.nativeElement as HTMLElement;
    }

    beforeEach(() => close.mockClear());

    it('should show the texts and close with true on confirm', () => {
      const element = render({
        title: 'Delete it?',
        description: 'Really',
        confirmLabel: 'Delete',
        isDestructive: true,
      });
      expect(element.querySelector('h2')?.textContent).toContain('Delete it?');
      expect(element.querySelector('p')?.textContent).toContain('Really');

      const [cancel, confirm] = Array.from(element.querySelectorAll('button'));
      expect(cancel.textContent).toContain('Cancel');
      expect(confirm.textContent).toContain('Delete');
      confirm.click();
      expect(close).toHaveBeenCalledWith(true);
    });

    it('should close with false on cancel', () => {
      const element = render({ title: 'Delete it?' });
      element.querySelector('button')?.click();
      expect(close).toHaveBeenCalledWith(false);
    });
  });

  describe('UiConfirmService', () => {
    const closed$ = new Subject<boolean | undefined>();
    const open = vi.fn();
    let service: UiConfirmService;

    beforeEach(() => {
      open.mockReset().mockReturnValue({ closed$ });
      TestBed.configureTestingModule({ providers: [{ provide: HlmDialogService, useValue: { open } }] });
      service = TestBed.inject(UiConfirmService);
    });

    it('should open an alert dialog with the data and resolve true when confirmed', async () => {
      const data = { title: 'Delete it?' };
      const result = firstValueFrom(service.confirm(data));
      closed$.next(true);

      expect(await result).toBe(true);
      expect(open).toHaveBeenCalledWith(
        UiConfirmDialog,
        expect.objectContaining({ context: data, role: 'alertdialog' }),
      );
    });

    it.each([false, undefined])('should resolve false when the dialog closes with %s', async (value) => {
      const result = firstValueFrom(service.confirm({ title: 'Delete it?' }));
      closed$.next(value);

      expect(await result).toBe(false);
    });
  });
});
