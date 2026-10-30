import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { normalizeTitle, splitParagraphs } from '../../step-compose/email-body.utils';

@Component({
  selector: 'nma-email-preview',
  templateUrl: './email-preview.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class EmailPreviewComponent {
  title = input('');
  text = input.required<string>();

  // Same logo as the backend broadcast template (stashify_utils email settings)
  readonly emailLogoUrl = 'https://cdn.stashify.cloud/logos/email-logo-pdp.png';
  readonly currentYear = new Date().getFullYear();

  heading = computed(() => normalizeTitle(this.title()));
  paragraphs = computed(() => splitParagraphs(this.text()));
}
