import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmLabelImports } from '@nuclia/ui-spartan/label';
import { HlmToggleGroupImports } from '@nuclia/ui-spartan/toggle-group';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
import { RecipientFilter } from '../../email.models';
import { RecipientsService } from '../recipients.service';
import { USER_SEGMENTS, UserSegment } from '../user-segments';

@Component({
  selector: 'nma-recipient-filters',
  templateUrl: './recipient-filters.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [HlmButtonImports, HlmLabelImports, HlmToggleGroupImports, HlmTooltipImports, NgIcon],
  providers: [provideIcons({ lucideInfo })],
  host: { class: 'block' },
})
export class RecipientFiltersComponent {
  protected recipients = inject(RecipientsService);

  readonly recipientFilters: { id: RecipientFilter; label: string }[] = [
    { id: 'AOWNER', label: 'Account owners' },
    { id: 'AMEMBER', label: 'Account members' },
    { id: 'ALL', label: 'All users' },
  ];
  readonly segmentFilters = USER_SEGMENTS;

  onFilterChange(value: unknown) {
    const filter = this.recipientFilters.find((item) => item.id === value)?.id;
    if (filter && filter !== this.recipients.recipientFilter()) {
      this.recipients.selectFilter(filter);
    }
  }

  onSegmentChange(value: unknown) {
    const known = new Set<string>(this.segmentFilters.map((item) => item.id));
    const segments = (Array.isArray(value) ? value : []).filter((id): id is UserSegment => known.has(id));
    const current = this.recipients.segmentFilter();
    if (segments.length !== current.length || segments.some((id) => !current.includes(id))) {
      this.recipients.selectSegments(segments);
    }
  }
}
