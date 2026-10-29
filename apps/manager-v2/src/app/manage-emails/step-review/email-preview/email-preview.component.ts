import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  selector: 'nma-email-preview',
  templateUrl: './email-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class EmailPreviewComponent {
  private sanitizer = inject(DomSanitizer);

  /** HTML produced by `buildEmailBody`, which escapes all user input. */
  bodyHtml = input.required<string>();

  // Same logo as the backend broadcast template (stashify_utils email settings)
  readonly emailLogoUrl = 'https://cdn.stashify.cloud/logos/email-logo-pdp.png';
  readonly currentYear = new Date().getFullYear();

  // Angular's sanitizer would strip the inline styles
  safeBody = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.bodyHtml()));
}
