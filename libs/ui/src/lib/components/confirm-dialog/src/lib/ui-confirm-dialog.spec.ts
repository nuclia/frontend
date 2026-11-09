import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { UiConfirmData, UiConfirmDialog } from './ui-confirm-dialog';

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
    const element = render({ title: 'Delete it?', description: 'Really', confirmLabel: 'Delete', isDestructive: true });
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
