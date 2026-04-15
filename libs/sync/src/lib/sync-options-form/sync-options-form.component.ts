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
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { filter, map, startWith, Subject, take, takeUntil } from 'rxjs';
import { InfoCardComponent, SisLabelModule, TwoColumnsConfigurationItemComponent } from '@nuclia/sistema';
import {
  PaButtonModule,
  PaDatePickerModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { LabelModule, LabelsService } from '@flaps/core';
import { LabelSets } from '@nuclia/core';
import { Classification } from '@nuclia/core';
import { ColoredLabel, ExtractionSelectComponent } from '@flaps/common';
import { ISyncEntity } from '../logic';
import { SyncOptions } from './sync-options.model';

@Component({
  selector: 'nsy-sync-options-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    TwoColumnsConfigurationItemComponent,
    InfoCardComponent,
    SisLabelModule,
    PaTextFieldModule,
    PaDatePickerModule,
    PaButtonModule,
    PaTogglesModule,
    LabelModule,
    ExtractionSelectComponent,
  ],
  templateUrl: './sync-options-form.component.html',
  styleUrl: './sync-options-form.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SyncOptionsFormComponent implements OnInit, OnDestroy {
  private labelService = inject(LabelsService);
  private cdr = inject(ChangeDetectorRef);
  private unsubscribeAll = new Subject<void>();

  @Input() isCloud = false;

  @Input() set existingConfig(value: ISyncEntity | null | undefined) {
    if (!value) {
      return;
    }
    this.labelSelection = value.labels || [];
    this.extractStrategy = value.extract_strategy || undefined;
    this.form.patchValue(
      this.isCloud
        ? {
            extensionUsage: value.file_filter?.mode || 'include',
            extensions: value.file_filter?.extensions?.join(', ') || '',
            globPatterns: value.file_filter?.glob_patterns?.join(', ') || '',
            from: value.modified_time_range?.from || '',
            to: value.modified_time_range?.to || '',
          }
        : {
            extensionUsage: value.filters?.fileExtensions?.exclude ? 'exclude' : 'include',
            extensions: value.filters?.fileExtensions?.extensions || '',
            globPatterns: '',
            from: value.filters?.modified?.from || '',
            to: value.filters?.modified?.to || '',
          },
    );
    // Compute lists eagerly so emitOptions() has correct data even before ngOnInit subscriptions are active
    this.extensionList = this.parseList(this.form.controls.extensions.value);
    this.globPatternList = this.parseList(this.form.controls.globPatterns.value);
    this.emitOptions();
    this.cdr.markForCheck();
  }

  @Output() optionsChange = new EventEmitter<SyncOptions>();

  form = new FormGroup({
    extensionUsage: new FormControl<'include' | 'exclude'>('include', { nonNullable: true }),
    extensions: new FormControl<string>('', { updateOn: 'blur' }),
    globPatterns: new FormControl<string>('', { updateOn: 'blur' }),
    from: new FormControl<string>(''),
    to: new FormControl<string>(''),
  });

  labelSets: LabelSets = {};
  labelSelection: ColoredLabel[] = [];
  hasLabelSet = false;
  extensionList: string[] = [];
  globPatternList: string[] = [];
  extractStrategy: string | undefined = undefined;

  ngOnInit() {
    this.labelService.resourceLabelSets
      .pipe(
        take(1),
        filter((sets) => !!sets),
        map((sets) => sets as LabelSets),
      )
      .subscribe((sets) => {
        this.labelSets = sets;
        this.hasLabelSet = Object.keys(sets).length > 0;
        this.labelSelection = this.labelSelection.map((l) => ({
          ...l,
          color: sets[l.labelset]?.color,
        }));
        this.cdr.markForCheck();
      });

    this.form.controls.extensions.valueChanges
      .pipe(takeUntil(this.unsubscribeAll), startWith(this.form.controls.extensions.value))
      .subscribe((value) => {
        this.extensionList = this.parseList(value);
        this.cdr.markForCheck();
      });

    this.form.controls.globPatterns.valueChanges
      .pipe(takeUntil(this.unsubscribeAll), startWith(this.form.controls.globPatterns.value))
      .subscribe((value) => {
        this.globPatternList = this.parseList(value);
        this.cdr.markForCheck();
      });

    this.form.valueChanges
      .pipe(takeUntil(this.unsubscribeAll), startWith(this.form.value))
      .subscribe(() => this.emitOptions());
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateLabelSelection(labels: Classification[]) {
    this.labelSelection = labels.map((label) => ({
      ...label,
      color: this.labelSets[label.labelset]?.color,
    }));
    this.emitOptions();
  }

  removeLabel(label: ColoredLabel) {
    this.labelSelection = this.labelSelection.filter(
      (l) => !(l.labelset === label.labelset && l.label === label.label),
    );
    this.emitOptions();
  }

  updateExtractStrategy(strategy: string | undefined) {
    this.extractStrategy = strategy;
    this.emitOptions();
  }

  private parseList(value: string | null | undefined): string[] {
    return value
      ? value
          .split(',')
          .map((s) => s.trim())
          .filter((s) => !!s)
      : [];
  }

  private emitOptions() {
    const val = this.form.getRawValue();
    let fromDate = val.from || '';
    let toDate = val.to || '';

    // If both dates present and from is after to, swap before normalizing
    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      [fromDate, toDate] = [toDate, fromDate];
    }

    this.optionsChange.emit({
      extensionMode: val.extensionUsage,
      extensions: this.extensionList,
      globPatterns: this.globPatternList,
      from: this.normalizeFromDate(fromDate),
      to: this.normalizeToDate(toDate),
      labels: this.labelSelection,
      extractStrategy: this.extractStrategy || undefined,
    });
  }

  private normalizeFromDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d.toISOString();
  }

  private normalizeToDate(value: string): string {
    if (!value) return '';
    const d = new Date(value);
    d.setHours(23, 59, 59, 999);
    return d.toISOString();
  }
}
