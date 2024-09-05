import { ChangeDetectionStrategy, Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { PaButtonModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';

@Component({
  selector: 'stf-question-block',
  standalone: true,
  imports: [CommonModule, TranslateModule, PaTextFieldModule, PaButtonModule],
  templateUrl: './question-block.component.html',
  styleUrl: './question-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionBlockComponent {
  @Output() queriesChange = new EventEmitter<string[]>();

  currentQuery = '';
  queries: string[] = [];

  get questionsLimitReached() {
    return this.queries.length >= 3;
  }

  addQuestion() {
    this.queries = this.queries.concat([this.currentQuery.trim()]);
    this.currentQuery = '';
    this.queriesChange.emit(this.queries);
  }

  deleteQuestion($index: number) {
    this.queries.splice($index, 1);
    this.queriesChange.emit(this.queries);
  }
}
