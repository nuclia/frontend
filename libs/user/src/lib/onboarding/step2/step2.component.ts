import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { SDKService, Zone } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { DatasetType, KbConfiguration } from '@nuclia/user';

const LANGUAGES = [
  'arabic',
  'catalan',
  'chinese',
  'danish',
  'english',
  'finnish',
  'french',
  'german',
  'italian',
  'japanese',
  'norwegian',
  'portuguese',
  'spanish',
  'swedish',
];

@Component({
  selector: 'nus-onboarding-step2',
  standalone: true,
  imports: [
    CommonModule,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    PaTogglesModule,
    ReactiveFormsModule,
    TranslateModule,
  ],
  templateUrl: './step2.component.html',
  styleUrls: ['../_common-step.scss', './step2.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Step2Component implements OnInit, OnDestroy {
  @Input()
  set zones(zones: Zone[] | null) {
    if (zones) {
      this._zones = zones;
      const validZones = zones.filter((zone) => !zone.notAvailableYet);
      if (validZones.length === 1) {
        this.configurationForm.controls.region.patchValue(validZones[0].slug);
      }
    }
  }
  get zones() {
    return this._zones;
  }

  @Output() submitStep2 = new EventEmitter<KbConfiguration>();

  private _zones: Zone[] = [];

  configurationForm = new FormGroup({
    region: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
    multilingual: new FormControl<'multilingual' | 'english'>('multilingual', { nonNullable: true }),
    startWith: new FormControl<'upload' | 'dataset'>('upload'),
    dataset: new FormControl<string>('', { nonNullable: true }),
  });

  languages: { id: string; label: string; selected: boolean }[];
  datasets: DatasetType[] = [];

  get multilingualSelected() {
    return this.configurationForm.controls.multilingual.value === 'multilingual';
  }
  get datasetSelected() {
    return this.configurationForm.controls.startWith.value === 'dataset';
  }
  get regionControl() {
    return this.configurationForm.controls.region;
  }
  get multilingualControl() {
    return this.configurationForm.controls.multilingual;
  }

  private unsubscribeAll = new Subject<void>();

  constructor(
    private translate: TranslateService,
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {
    const languages: { id: string; label: string }[] = LANGUAGES.map((language) => ({
      id: language,
      label: this.translate.instant(`onboarding.step2.languages.${language}`),
    })).sort((a, b) => a.label.localeCompare(b.label));
    languages.push({ id: 'other', label: this.translate.instant(`onboarding.step2.languages.other`) });
    this.languages = languages.map((language) => ({ ...language, selected: false }));
  }

  ngOnInit() {
    this.regionControl.valueChanges
      .pipe(
        switchMap((zoneSlug) => this.sdk.nuclia.rest.get<DatasetType[]>(`/exports`, undefined, undefined, zoneSlug)),
        takeUntil(this.unsubscribeAll),
      )
      .subscribe((datasets) => {
        this.datasets = datasets;
        this.cdr.detectChanges();
      });

    this.multilingualControl.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe((language) => {
      if (language === 'english') {
        this.languages.forEach((language) => (language.selected = false));
      }
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  submitForm() {
    const configFormValue = this.configurationForm.getRawValue();
    const configuration: KbConfiguration = {
      zoneSlug: configFormValue.region,
      multilingual: this.multilingualSelected,
      languages: this.languages.filter((language) => language.selected).map((language) => language.id),
      ownData: configFormValue.startWith === 'upload',
      dataset: this.datasetSelected ? configFormValue.dataset : undefined,
    };
    this.submitStep2.emit(configuration);
  }
}
