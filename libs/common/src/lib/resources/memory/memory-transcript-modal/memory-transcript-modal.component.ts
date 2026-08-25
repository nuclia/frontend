import { CommonModule, DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ModalRef, PaModalModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { MemoryEntry } from '../memory.model';

export interface MemoryTranscriptModalData {
  sessionLabel: string;
  entries: MemoryEntry[];
}

@Component({
  selector: 'stf-memory-transcript-modal',
  imports: [CommonModule, DatePipe, PaModalModule, TranslateModule],
  templateUrl: './memory-transcript-modal.component.html',
  styleUrl: './memory-transcript-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MemoryTranscriptModalComponent {
  protected modal = inject(ModalRef<MemoryTranscriptModalData>);
  protected data = this.modal.config.data;
}
