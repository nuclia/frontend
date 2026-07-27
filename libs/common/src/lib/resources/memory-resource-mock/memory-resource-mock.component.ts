import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { EditResourceService } from '../edit-resource';
import { MemoryMockEntry, MemoryMockFact } from './memory-resource-mock.config';
import { MemoryResourceMockService } from './memory-resource-mock.service';

@Component({
  selector: 'stf-memory-resource-mock',
  templateUrl: './memory-resource-mock.component.html',
  styleUrl: './memory-resource-mock.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
  providers: [MemoryResourceMockService],
})
export class MemoryResourceMockComponent implements OnInit {
  private modal = inject(SisModalService);
  private toaster = inject(SisToastService);
  private editResource = inject(EditResourceService);

  protected service = inject(MemoryResourceMockService);

  ngOnInit() {
    this.editResource.setCurrentView('memory');
  }

  protected setTopic(topicId: string) {
    this.service.setTopic(topicId);
  }

  protected setUser(userId: string) {
    this.service.setUser(userId);
  }

  protected setFactExpanded(factId: string, expanded: boolean) {
    this.service.setFactExpanded(factId, expanded);
  }

  protected relatedEntries(fact: MemoryMockFact): MemoryMockEntry[] {
    return this.service.getRelatedEntries(fact);
  }

  protected factSummary(fact: MemoryMockFact): string {
    return this.conciseSummary(fact.text);
  }

  protected sourceSessionLabel(fact: MemoryMockFact): string {
    const rawLabel = fact.source_session.replace(/\bsession\b/gi, '').trim();
    const selectedUserLabel = this.service.selectedUser()?.label?.trim() || '';
    if (!selectedUserLabel) {
      return rawLabel;
    }
    const normalizedSelectedUser = selectedUserLabel.toLowerCase();
    const normalizedRawLabel = rawLabel.toLowerCase();
    return normalizedRawLabel === normalizedSelectedUser ? '' : rawLabel;
  }

  protected sourceSessionDate(fact: MemoryMockFact): string | undefined {
    return this.relatedEntries(fact)[0]?.at;
  }

  private conciseSummary(text: string): string {
    return (
      text
        .split('.')[0]
        ?.replace(/\s*\([^)]*\)/g, '')
        .replace(/\s+completion\s+before\b.*$/i, '')
        .replace(/\s+with\b.*$/i, '')
        .replace(/\s+(during|because|since|when|while|under|after)\b.*$/i, '')
        .replace(/,\s.*$/, '')
        .replace(/\s+([’'])/g, '$1')
        .replace(/\s{2,}/g, ' ')
        .trim() || text.trim()
    );
  }

  protected deleteMemoryResource() {
    this.modal
      .openConfirm({
        title: 'resource.memory-mock.delete.title',
        description: 'resource.memory-mock.delete.description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(filter((confirm) => !!confirm))
      .subscribe(() => this.toaster.success('resource.memory-mock.delete.success'));
  }
}
