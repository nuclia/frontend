import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaExpanderModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MemoryEntry, MemoryFact } from '../memory.model';

export interface MemoryFactsModalData {
  sessionLabel: string;
  facts: MemoryFact[];
  entries: MemoryEntry[];
}

@Component({
  selector: 'stf-memory-facts-modal',
  imports: [CommonModule, DatePipe, PaModalModule, PaExpanderModule, TranslateModule],
  templateUrl: './memory-facts-modal.component.html',
  styleUrl: './memory-facts-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryFactsModalComponent {
  protected modal = inject(ModalRef<MemoryFactsModalData>);
  protected data = this.modal.config.data;

  // Most-recent-first, same ordering as the Facts tab.
  protected facts = [...(this.data?.['facts'] || [])].sort((a, b) =>
    (b.timestamp || '').localeCompare(a.timestamp || ''),
  );

  private expandedFactIds = new Set<string>();

  protected toggleFact(fact: MemoryFact) {
    if (this.isFactExpanded(fact.id)) {
      this.expandedFactIds.delete(fact.id);
    } else {
      this.expandedFactIds.add(fact.id);
    }
  }

  protected isFactExpanded(factId: string): boolean {
    return this.expandedFactIds.has(factId);
  }

  protected relatedEntriesOf(fact: MemoryFact): MemoryEntry[] {
    return (this.data?.['entries'] || []).filter((entry: MemoryEntry) =>
      fact.content.related_entry_ids.includes(entry.id),
    );
  }
}
