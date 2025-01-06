import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { injectScript } from '@flaps/core';

const SURVEY_OCCURRENCES = [20, 300, 600, 2000, 5000];
const SURVEY_NEXT_OCCURRENCE_KEY = 'survey_next_occurrence';

@Component({
  selector: 'app-knowledge-box-survey',
  templateUrl: 'survey.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class SurveyComponent implements OnInit, OnDestroy {
  @Input() totalSearch?: number | null;
  render = false;

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    const nextOccurrence = localStorage.getItem(SURVEY_NEXT_OCCURRENCE_KEY)
      ? JSON.parse(localStorage.getItem(SURVEY_NEXT_OCCURRENCE_KEY) as string)
      : SURVEY_OCCURRENCES[0];
    const totalSearch = this.totalSearch || 0;
    if (totalSearch >= nextOccurrence) {
      this.render = true;
      this.cdr.detectChanges();
      localStorage.setItem(
        SURVEY_NEXT_OCCURRENCE_KEY,
        JSON.stringify(SURVEY_OCCURRENCES.find((occurrence) => occurrence > totalSearch) || nextOccurrence + 5000),
      );
      injectScript('//embed.typeform.com/next/embed.js').subscribe();
    }
  }

  ngOnDestroy(): void {
    if (this.render) {
      (document as any).getElementsByClassName('tf-v1-popover')[0]?.remove();
    }
  }
}
