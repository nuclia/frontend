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
import { KbConfiguration, SDKService, Zone } from '@flaps/core';
import { PaButtonModule, PaIconModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, switchMap, takeUntil } from 'rxjs';
import { DatasetType } from '../onboarding.models';
import { LanguageFieldComponent } from '../language-field/language-field.component';

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
    LanguageFieldComponent,
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
    startWith: new FormControl<'upload' | 'dataset'>('upload'),
    dataset: new FormControl<string>('', { nonNullable: true }),
  });

  datasets: DatasetType[] = [];

  get datasetSelected() {
    return this.configurationForm.controls.startWith.value === 'dataset';
  }
  get regionControl() {
    return this.configurationForm.controls.region;
  }

  multilingualSelected = true;
  languages: string[] = [];

  private unsubscribeAll = new Subject<void>();

  constructor(
    private sdk: SDKService,
    private cdr: ChangeDetectorRef,
  ) {}

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
      languages: this.languages,
      ownData: configFormValue.startWith === 'upload',
      dataset: this.datasetSelected ? configFormValue.dataset : undefined,
    };
    this.submitStep2.emit(configuration);
  }

  updateLanguages(data: { multilingualSelected: boolean; languages: string[] }) {
    this.multilingualSelected = data.multilingualSelected;
    this.languages = data.languages;
    this.cdr.markForCheck();
  }
}
