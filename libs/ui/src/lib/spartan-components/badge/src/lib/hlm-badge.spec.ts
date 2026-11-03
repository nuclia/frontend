import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import type { BadgeVariants } from './hlm-badge';
import { HlmBadge } from './hlm-badge';

@Component({
  selector: 'test-badge-host',
  imports: [HlmBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span
      hlmBadge
      [variant]="variant()">
      New
    </span>
  `,
})
class BadgeHostComponent {
  readonly variant = signal<BadgeVariants['variant']>('default');
}

describe('HlmBadge', () => {
  async function render() {
    const fixture = TestBed.createComponent(BadgeHostComponent);
    await fixture.whenStable();
    return { fixture, badge: fixture.nativeElement.querySelector('span') as HTMLElement };
  }

  it('should render the default variant with its slot attributes and classes', async () => {
    const { badge } = await render();

    expect(badge.textContent?.trim()).toBe('New');
    expect(badge.getAttribute('data-slot')).toBe('badge');
    expect(badge.getAttribute('data-variant')).toBe('default');
    expect(badge.classList).toContain('bg-primary');
    expect(badge.classList).toContain('text-primary-foreground');
  });

  it('should switch classes and data-variant when the variant input changes', async () => {
    const { fixture, badge } = await render();

    fixture.componentInstance.variant.set('destructive');
    await fixture.whenStable();

    expect(badge.getAttribute('data-variant')).toBe('destructive');
    expect(badge.classList).toContain('text-destructive');
    expect(badge.classList).not.toContain('bg-primary');
  });
});
