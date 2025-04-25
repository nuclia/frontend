import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { InternetProviderType } from '@nuclia/core';
import { map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective } from '../../basic-elements';
import { InternetAgentUI, isInternetProvider } from '../../workflow.models';

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
  ],
  templateUrl: './internet-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InternetFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);

  override form = new FormGroup({
    internet: new FormGroup({
      provider: new FormControl<InternetProviderType | ''>('', {
        validators: [Validators.required],
        nonNullable: true,
      }),
      brave: new FormGroup({
        domain: new FormControl<string>('', { nonNullable: true }),
        country: new FormControl<string>('', { nonNullable: true }),
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
    return this.configForm.controls.provider.getRawValue();
  }
  get perplexityDomains() {
    return this.configForm.controls.perplexity.controls.domain;
  }

  providerOptions: Observable<OptionModel[]> = this.sdk.currentArag.pipe(
    take(1),
    switchMap((arag) => arag.getDrivers()),
    map((drivers) =>
      drivers
        .filter((driver) => isInternetProvider(driver.provider))
        .map(
          (driver) =>
            new OptionModel({ id: driver.id, label: driver.name, value: driver.provider, help: driver.provider }),
        ),
    ),
  );

  ngOnInit(): void {
    if (this.config) {
      const config = this.config as InternetAgentUI;
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
}
