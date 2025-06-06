import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InternetDriver, InternetProviderType } from '@nuclia/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { map, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';
import { InternetAgentUI, isInternetProvider } from '../../workflow.models';
import { aragUrl } from '../../workflow.state';

@Component({
  selector: 'app-internet-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    InfoCardComponent,
    RouterLink,
  ],
  templateUrl: './internet-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    internet: new FormGroup({
      rules: new FormArray<FormControl<string>>([]),
      source: new FormControl<string>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      brave: new FormGroup({
        domain: new FormControl<string | null>(null),
        country: new FormControl<string | null>(null),
      }),
      perplexity: new FormGroup({
        domain: new FormArray<FormControl<string>>([new FormControl<string>('', { nonNullable: true })]),
        top_k: new FormControl<number>(0, { nonNullable: true, validators: [Validators.pattern('^[0-9]*$')] }),
        related_questions: new FormControl<boolean>(false, { nonNullable: true }),
        images: new FormControl<boolean>(false, { nonNullable: true }),
      }),
    }),
  });
  override get configForm() {
    return this.form.controls.internet;
  }

  get provider() {
    return this.configForm.controls.source.getRawValue();
  }
  get perplexityDomains() {
    return this.configForm.controls.perplexity.controls.domain;
  }

  driversPath = computed(() => `${aragUrl()}/drivers`);
  providerOptions = signal<OptionModel[] | null>(null);
  drivers = signal<InternetDriver[]>([]);
  currentProvider = signal<string>('');

  ngOnInit(): void {
    this.sdk.currentArag
      .pipe(
        take(1),
        switchMap((arag) => arag.getDrivers()),
        map((drivers) => {
          const internetDrivers = drivers.filter((driver) => isInternetProvider(driver.provider));
          this.drivers.set(internetDrivers as InternetDriver[]);
          return internetDrivers.map(
            (driver) =>
              new OptionModel({
                id: driver.identifier,
                label: driver.name,
                value: driver.identifier,
                help: driver.provider,
              }),
          );
        }),
      )
      .subscribe((options) => this.providerOptions.set(options));
    if (this.config) {
      const config = this.config as InternetAgentUI;
      this.currentProvider.set(config.provider);
      if (config.perplexity.domain.length > 1) {
        for (let i = 0; i < config.perplexity.domain.length - 1; i++) {
          this.addPerplexityDomain();
        }
        this.perplexityDomains.patchValue(config.perplexity.domain);
      }
    }
  }

  addPerplexityDomain() {
    this.perplexityDomains.push(new FormControl<string>('', { nonNullable: true }));
  }
  removePerplexityDomain(index: number) {
    this.perplexityDomains.removeAt(index);
  }

  updateCurrentDriver(source: string) {
    const options = this.providerOptions();
    if (!options) {
      return;
    }
    const currentOption = options.find((option) => option.value === source);
    // provider is stored in option help
    if (currentOption?.help) {
      this.currentProvider.set(currentOption.help);
    }
  }

  override submit(): void {
    if (this.form.valid) {
      const rawValue = this.configForm.getRawValue();
      const provider: InternetProviderType | undefined = this.drivers().find(
        (driver) => driver.identifier === rawValue.source,
      )?.provider;
      if (!provider) {
        throw new Error(`Source ${rawValue.source} not found in driver list`);
      }
      const internetForm: InternetAgentUI = {
        ...rawValue,
        provider,
      };
      this.submitForm.emit(internetForm);
    }
  }
}
