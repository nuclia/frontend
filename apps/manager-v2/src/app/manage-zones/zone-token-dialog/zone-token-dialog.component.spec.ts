import { DIALOG_DATA } from '@angular/cdk/dialog';
import { TestBed } from '@angular/core/testing';
import { BrnDialogRef } from '@spartan-ng/brain/dialog';
import { ZoneTokenDialogComponent } from './zone-token-dialog.component';

describe('ZoneTokenDialogComponent', () => {
  it('should show a truncated token and copy the full token', async () => {
    const writeText = vi.fn();
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    await TestBed.configureTestingModule({
      imports: [ZoneTokenDialogComponent],
      providers: [
        { provide: DIALOG_DATA, useValue: { token: `x${'a'.repeat(40)}` } },
        {
          provide: BrnDialogRef,
          useValue: { dialogId: 'test', registerDescription: vi.fn(), unregisterDescription: vi.fn() },
        },
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(ZoneTokenDialogComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('code')?.textContent?.trim()).toBe(`${'a'.repeat(29)}…`);

    element.querySelector<HTMLButtonElement>('[data-cy="copy-token"]')?.click();
    fixture.detectChanges();
    expect(writeText).toHaveBeenCalledWith(`x${'a'.repeat(40)}`);
    expect(element.querySelector('[data-cy="copy-token"]')?.textContent).toContain('Copied');
    vi.unstubAllGlobals();
  });
});
