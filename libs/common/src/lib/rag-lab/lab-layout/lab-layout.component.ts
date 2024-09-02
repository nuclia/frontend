import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import {
  AccordionBodyDirective,
  AccordionComponent,
  AccordionItemComponent,
  PaButtonModule,
  PaExpanderModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BehaviorSubject, Observable, Subject, tap } from 'rxjs';
import { Prompts } from '@nuclia/core';
import { QuestionBlockComponent } from '../question-block';
import { RagLabService } from '../rag-lab.service';
import { map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'stf-lab-layout',
  standalone: true,
  imports: [
    CommonModule,
    AccordionComponent,
    AccordionItemComponent,
    AccordionBodyDirective,
    ReactiveFormsModule,
    QuestionBlockComponent,
    TranslateModule,
    PaExpanderModule,
    PaButtonModule,
  ],
  templateUrl: './lab-layout.component.html',
  styleUrl: '../_common-lab.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LabLayoutComponent implements OnInit, OnDestroy {
  private cdr = inject(ChangeDetectorRef);
  private ragLabService = inject(RagLabService);
  private unsubscribeAll = new Subject<void>();

  @Input({ required: true }) type!: 'prompt' | 'rag';
  @Input({ required: true }) formTitle = '';

  @Output() queriesChange = new EventEmitter<string[]>();
  @Output() downloadCsv = new EventEmitter<void>();

  @ViewChild('formContainer', { read: AccordionItemComponent }) formContainer?: AccordionItemComponent;
  @ViewChild('resultsContainer', { read: AccordionItemComponent }) resultsContainer?: AccordionItemComponent;

  private _results = new BehaviorSubject<
    {
      query: string;
      prompt?: Prompts;
      results: { model: string; modelName: string; answer: string; rendered?: string }[];
    }[]
  >([]);

  updateResultsExpanderSize = new Subject<unknown>();
  results: Observable<
    {
      query: string;
      prompt?: Prompts;
      results: { model: string; modelName: string; answer: string; rendered?: string }[];
    }[]
  > = this._results.pipe(
    tap((result) => {
      this.cdr.detectChanges();
      this.updateResultsExpanderSize.next(result);
      this.updateResultHeight();
    }),
  );
  hasResults = this._results.pipe(map((results) => results.length > 0));
  queryCollapsed: { [query: string]: boolean } = {};

  ngOnInit() {
    if (this.type === 'prompt') {
      this.ragLabService.promptLabResults
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((results) => this._results.next(results));
    } else {
      this.ragLabService.ragLabResults
        .pipe(takeUntil(this.unsubscribeAll))
        .subscribe((results) => this._results.next(results));
    }
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  onQueriesChange(queries: string[]) {
    this.queriesChange.emit(queries);
    this.onResizingFormContent();
  }

  onResizingFormContent() {
    this.formContainer?.updateContentHeight();
  }

  updateResultHeight() {
    // expanders inside the accordion has an animation during 160ms,
    // so final expander height is available after this delay, we add 10ms as a safe gap
    setTimeout(() => this.resultsContainer?.updateContentHeight(), 170);
  }
}
