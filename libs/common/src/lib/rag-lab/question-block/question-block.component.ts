import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { map, switchMap, take, tap } from 'rxjs';
import { SearchWidgetStorageService } from '../../search-widget';

@Component({
  selector: 'stf-question-block',
  imports: [CommonModule, TranslatePipe, PaTextFieldModule, PaButtonModule],
  templateUrl: './question-block.component.html',
  styleUrl: './question-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBlockComponent {
  searchWidgetStorage = inject(SearchWidgetStorageService);

  @Output() queriesChange = new EventEmitter<string[]>();

  currentQuery = '';
  queries = this.searchWidgetStorage.ragLabQuestions.pipe(
    tap((queries) => {
      this.queriesChange.emit(queries);
    }),
  );
  questionsLimitReached = this.queries.pipe(map((queries) => queries.length >= 3));

  addQuestion() {
    if (!this.currentQuery.trim()) {
      return;
    }
    this.queries
      .pipe(
        take(1),
        switchMap((queries) =>
          this.searchWidgetStorage.storeRagLabQuestions(queries.concat([this.currentQuery.trim()])),
        ),
      )
      .subscribe(() => {
        this.currentQuery = '';
      });
  }

  deleteQuestion($index: number) {
    this.queries
      .pipe(
        take(1),
        switchMap((queries) =>
          this.searchWidgetStorage.storeRagLabQuestions([...queries.slice(0, $index), ...queries.slice($index + 1)]),
        ),
      )
      .subscribe();
  }
}
