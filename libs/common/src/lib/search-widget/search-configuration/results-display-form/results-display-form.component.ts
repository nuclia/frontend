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
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { ResultDisplayConfig } from '../../search-widget.models';
import { Subject } from 'rxjs';
import { FeaturesService } from '@flaps/core';
import { takeUntil } from 'rxjs/operators';
import { BadgeComponent, InfoCardComponent } from '@nuclia/sistema';
import { JsonValidator } from '../../../validators';

@Component({
  selector: 'stf-results-display-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTogglesModule,
    PaTextFieldModule,
    InfoCardComponent,
    BadgeComponent,
  ],
  templateUrl: './results-display-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResultsDisplayFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private featuresService = inject(FeaturesService);

  @Input() set config(value: ResultDisplayConfig | undefined) {
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
    jsonOutput: new FormControl<boolean>(false, { nonNullable: true }),
    jsonSchema: new FormControl<string>('', { nonNullable: true, validators: [JsonValidator()] }),
  });

  isKnowledgeGraphEnabled = this.featuresService.unstable.knowledgeGraph;

  get displayResultsEnabled() {
    return this.form.controls.displayResults.value;
  }
  get showResultTypeControl() {
    return this.form.controls.showResultType;
  }
  get jsonOutputEnabled() {
    return this.form.controls.jsonOutput.value;
  }

  ngOnInit() {
    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll))
      .subscribe(() => this.configChanged.emit({ ...this.form.getRawValue() }));
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  /**
   * Citations are incompatible with json output
   */
  disableCitations(jsonOutputEnabled: boolean) {
    if (jsonOutputEnabled) {
      this.showResultTypeControl.patchValue('all-resources');
      this.showResultTypeControl.disable();
    } else if (this.showResultTypeControl.disabled) {
      this.showResultTypeControl.enable();
    }
  }
}
