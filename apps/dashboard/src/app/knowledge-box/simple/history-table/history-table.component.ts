import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaButtonModule, PaIconModule, PaTableModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, filter, map, Observable, switchMap } from 'rxjs';
import { ConversationsPage, SimpleKBService } from '../simple-kb.service';
import { SDKService } from '@flaps/core';
import { NsiSkeletonComponent, SisModalService } from '@nuclia/sistema';

interface TableRow {
  resourceId: string;
  questionIdent: string;
  questionIndex: number;
  question: string;
  questionShort?: string;
  answer: string;
  answerIdent: string;
  answerShort?: string;
  created: string;
  failed: boolean;
}

@Component({
  selector: 'app-history-table',
  templateUrl: './history-table.component.html',
  styleUrl: './history-table.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, NsiSkeletonComponent, PaButtonModule, PaIconModule, PaTableModule, TranslateModule],
})
export class HistoryTableComponent {
  simpleKBService = inject(SimpleKBService);
  sdk = inject(SDKService);
  modalService = inject(SisModalService);

  columns = ['question', 'answer', 'status', 'date', 'delete'];
  page = signal(0);
  loading = signal(true);
  expanded = signal<{ [key: string]: boolean }>({});

  conversations = new BehaviorSubject<ConversationsPage>({ items: [], hasMore: false });

  rows: Observable<TableRow[]> = this.conversations.pipe(
    map((conversations) =>
      conversations.items.reduce((acc, curr) => {
        curr.messages.forEach((message, index, all) => {
          if (index % 2 === 1) {
            acc.push({
              resourceId: curr.resource.id,
              question: all[index - 1].content.text,
              questionIndex: index - 1,
              questionIdent: all[index - 1].ident,
              questionShort: this.getShortText(all[index - 1].content.text, 70),
              answer: message.content.text,
              answerIdent: message.ident,
              answerShort: this.getShortText(message.content.text, 120),
              created: curr.resource.created + 'Z',
              failed: message.content.text === '',
            });
          }
        });
        return acc;
      }, [] as TableRow[]),
    ),
    map((rows) =>
      rows.sort((a, b) =>
        a.created !== b.created
          ? new Date(b.created).getTime() - new Date(a.created).getTime()
          : b.questionIndex - a.questionIndex,
      ),
    ),
  );

  constructor() {
    this.loadPage(0);
  }

  loadPage(page: number, replace = false) {
    this.loading.set(true);
    this.simpleKBService.getConversationsPage(page).subscribe((results) => {
      this.conversations.next({
        items: replace ? results.items : [...this.conversations.value.items, ...results.items],
        hasMore: results.hasMore,
      });
      this.page.set(page);
      this.loading.set(false);
    });
  }

  deleteQuestion(row: TableRow) {
    this.modalService
      .openConfirm({
        title: 'simple.delete-question',
        description: 'simple.delete-question-description',
        confirmLabel: 'generic.delete',
        isDestructive: true,
      })
      .onClose.pipe(
        filter((result) => result),
        switchMap(() => this.simpleKBService.deleteQuestion(row.resourceId, row.questionIdent, row.answerIdent)),
      )
      .subscribe(() => {
        this.loadPage(0, true);
      });
  }

  getShortText(text: string, maxLength: number) {
    if (text.length > maxLength) {
      return text.slice(0, maxLength) + '...';
    }
    return undefined;
  }

  toggleExpanded(id: string) {
    this.expanded.update((expanded) => ({ ...expanded, [id]: !expanded[id] }));
  }
}
