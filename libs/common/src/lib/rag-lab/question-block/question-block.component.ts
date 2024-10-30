import { ChangeDetectionStrategy, Component, EventEmitter, inject, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { SearchWidgetStorageService } from '../../search-widget';
import { map, switchMap, take, tap } from 'rxjs';

@Component({
  selector: 'stf-question-block',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaTextFieldModule, PaButtonModule],
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
