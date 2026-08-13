import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, ViewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl } from '@angular/forms';
import { DatePickerComponent, ModalConfig, ModalRef, PaDatePickerModule, PaModalModule } from '@guillotinaweb/pastanaga-angular';
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
  private destroyRef = inject(DestroyRef);

  protected service = inject(MemoryResourceMockService);
  protected factDateControl = new FormControl<string | null>(null);

  // pa-date-picker manages its own display-only inputControl separately from the
  // bound FormControl. Resetting inputControl directly is required to clear the
  // visible text, since the component's internal valueChanges pipe filters out null.
  @ViewChild(DatePickerComponent) private datePicker?: DatePickerComponent;

  ngOnInit() {
    this.editResource.setCurrentView('memory');
    this.factDateControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((dateIso) => this.service.setDateFilter(dateIso || null));
  }

  protected setFactExpanded(factId: string, expanded: boolean) {
    this.service.setFactExpanded(factId, expanded);
  }

  protected relatedEntries(fact: MemoryMockFact): MemoryMockEntry[] {
    return this.service.getRelatedEntries(fact);
  }

  // TODO: replace fact.source_session with a structured author field from the API.
  // Currently source_session is a plain string label used as the HR person's display name.
  protected factOwnerLabel(fact: MemoryMockFact): string {
    return fact.source_session;
  }

  protected sourceSessionDate(fact: MemoryMockFact): string | undefined {
    return this.relatedEntries(fact)[0]?.at;
  }

  protected clearDateFilter() {
    this.factDateControl.reset();
    this.datePicker?.inputControl.reset();
  }

  protected openTranscript(fact: MemoryMockFact, entry: MemoryMockEntry) {
    this.modal.openModal(
      MemoryTranscriptModalComponent,
      new ModalConfig({
        data: {
          // TODO: replace getDummyTranscript with a real API call to fetch the
          // full conversation transcript for this session entry.
          sourceTimestamp: entry.at,
          transcript: this.service.getDummyTranscript(entry),
        },
      }),
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
  styles: [`
    :host ::ng-deep pa-modal-advanced.memory-transcript-modal .pa-modal.pa-modal-advanced {
      @media (min-width: 900px) { width: min(1100px, 95vw); }
    }
    .transcript-content {
      width: min(1000px, 90vw);
      max-height: 78vh;
      overflow: auto;
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 12px 0 24px;
    }
    .turns-list { display: flex; flex-direction: column; gap: 8px; }
    .turn { border: 1px solid #e3e6eb; border-radius: 4px; padding: 8px; }
    .turn p { margin: 4px 0 0; white-space: pre-wrap; overflow-wrap: anywhere; }
    .turn-speaker { color: #6b7280; }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class MemoryTranscriptModalComponent {
  protected modal = inject(ModalRef<MemoryTranscriptModalData>);
  protected data = this.modal.config.data;
}

