import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ModalConfig } from '@guillotinaweb/pastanaga-angular';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { SisModalService, SisToastService } from '@nuclia/sistema';
import { filter } from 'rxjs';
import { EditResourceService } from '../edit-resource';
import { MemoryMockEntry, MemoryMockFact, MemoryMockTranscriptTurn } from './memory-resource-mock.config';
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

  protected openTranscript(fact: MemoryMockFact, entry: MemoryMockEntry) {
    this.modal.openModal(
      MemoryTranscriptModalComponent,
      new ModalConfig({
        data: {
          sessionDetails: this.sourceSessionLabel(fact),
          sourceTimestamp: entry.at,
          transcript: this.service.getDummyTranscript(entry),
        },
      }),
    );
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

interface MemoryTranscriptModalData {
  sessionDetails: string;
  sourceTimestamp: string;
  transcript: MemoryMockTranscriptTurn[];
}

@Component({
  selector: 'stf-memory-transcript-modal',
  standalone: true,
  imports: [CommonModule, DatePipe, PaModalModule, TranslateModule],
  template: `
    <pa-modal-advanced fitContentHeight class="memory-transcript-modal">
      <pa-modal-title>{{ 'resource.memory-mock.transcript.title' | translate }}</pa-modal-title>

      <pa-modal-content>
        <div class="transcript-content">
          <div class="title-xxs">{{ 'resource.memory-mock.transcript.session' | translate }}</div>
          <p class="body-s">{{ data?.sessionDetails || '—' }}</p>
          <div class="title-xxs">{{ 'resource.memory-mock.transcript.timestamp' | translate }}</div>
          <p class="body-s">{{ data?.sourceTimestamp | date: 'medium' }}</p>

          <div class="title-xxs">{{ 'resource.memory-mock.transcript.full' | translate }}</div>
          <div class="turns-list">
            @for (turn of data?.transcript || []; track turn.id) {
              <article class="turn">
                <div class="title-xxs turn-speaker">{{ turn.speaker }}</div>
                <p class="body-s">{{ turn.message }}</p>
              </article>
            }
          </div>
        </div>
      </pa-modal-content>
    </pa-modal-advanced>
  `,
  styles: [
    `
      :host ::ng-deep pa-modal-advanced.memory-transcript-modal .pa-modal.pa-modal-advanced {
        @media (min-width: 900px) {
          width: min(1100px, 95vw);
        }
      }

      .transcript-content {
        width: min(1000px, 90vw);
        max-height: 78vh;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 8px;
        padding: 12px 0 24px;
        box-shadow: inset 0 8px 8px -8px rgba(17, 24, 39, 0.18);
      }

      .turns-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .turn {
        border: 1px solid #e3e6eb;
        border-radius: 4px;
        padding: 8px;
      }

      .turn p {
        margin: 4px 0 0;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
      }

      .turn-speaker {
        color: #6b7280;
      }
    `,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MemoryTranscriptModalComponent {
  protected modal = inject(ModalRef<MemoryTranscriptModalData>);
  protected data = this.modal.config.data;
}
