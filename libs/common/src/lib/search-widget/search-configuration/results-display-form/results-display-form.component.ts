import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ResultDisplayConfig } from '../../search-widget.models';
import { Subject } from 'rxjs';
import { FeaturesService } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'stf-results-display-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule, PaTogglesModule],
  templateUrl: './results-display-form.component.html',
  styleUrl: './results-display-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDisplayFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);

  @Input() set config(value: ResultDisplayConfig) {
    if (value) {
      this.form.patchValue(value);
    }
  }
  @Input() set useSynonymsEnabled(value: boolean) {
    if (value) {
      this.form.controls.relations.disable();
    } else {
      this.form.controls.relations.enable();
    }
  }

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<ResultDisplayConfig>();

  form = new FormGroup({
    displayResults: new FormControl<boolean>(false, { nonNullable: true }),
    showResultType: new FormControl<'citations' | 'all-resources'>('all-resources', { nonNullable: true }),
    displayMetadata: new FormControl<boolean>(false, { nonNullable: true }),
    displayThumbnails: new FormControl<boolean>(false, { nonNullable: true }),
    displayFieldList: new FormControl<boolean>(false, { nonNullable: true }),
    relations: new FormControl<boolean>(false, { nonNullable: true }),
    relationGraph: new FormControl<boolean>(false, { nonNullable: true }),
  });

  isKnowledgeGraphEnabled = this.featuresService.unstable.knowledgeGraph;

  get displayResultsEnabled() {
    return this.form.controls.displayResults.value;
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe((value) => this.configChanged.emit({ ...this.form.getRawValue() }));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }
}
