import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { EditResourceService } from '../edit-resource';
import { MemoryMockEntry, MemoryMockFact, MemoryMockTab } from './memory-resource-mock.config';
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

  protected setTab(tab: MemoryMockTab) {
    this.service.setTab(tab);
  }

  protected setTopic(topicId: string) {
    this.service.setTopic(topicId);
  }

  protected setUser(userId: string) {
    this.service.setUser(userId);
  }

  protected setSession(sessionId: string) {
    this.service.selectSession(sessionId);
  }

  protected setEntryExpanded(entryId: string, expanded: boolean) {
    this.service.setEntryExpanded(entryId, expanded);
  }

  protected setFactExpanded(factId: string, expanded: boolean) {
    this.service.setFactExpanded(factId, expanded);
  }

  protected relatedEntries(fact: MemoryMockFact): MemoryMockEntry[] {
    return this.service.getRelatedEntries(fact);
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
