import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { NavigationService, SDKService } from '@flaps/core';
import { OptionModel, PaButtonModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { NucliaDBDriver } from '@nuclia/core';
import { ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { forkJoin, map, Observable, switchMap, take } from 'rxjs';
import { ConfigurationFormComponent, FormDirective, RulesFieldComponent } from '../../basic-elements';

@Component({
  selector: 'app-rephrase-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaButtonModule,
    PaTextFieldModule,
    PaTogglesModule,
    ConfigurationFormComponent,
    RulesFieldComponent,
    ExpandableTextareaComponent,
    InfoCardComponent,
    RouterLink,
  ],
  templateUrl: './rephrase-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RephraseFormComponent extends FormDirective implements OnInit {
  private sdk = inject(SDKService);
  private navigationService = inject(NavigationService);

  override form = new FormGroup({
    rephrase: new FormGroup({
      prompt: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      kb: new FormControl('', { validators: [Validators.required], nonNullable: true }),
      extend: new FormControl(false),
      synonyms: new FormControl(false),
      history: new FormControl(false),
      userInfo: new FormControl(false),
      rules: new FormArray<FormControl<string>>([]),
      // TODO manage rids and labels
    }),
  });

  override get configForm() {
    return this.form.controls.rephrase;
  }

  private aragUrl = signal('');
  driversPath = computed(() => `${this.aragUrl()}/drivers`);
  sourceOptions = signal<OptionModel[] | null>(null);

  ngOnInit() {
    forkJoin([this.sdk.currentAccount.pipe(take(1)), this.sdk.currentArag.pipe(take(1))])
      .pipe(
        map(([account, arag]) => {
          this.aragUrl.set(this.navigationService.getRetrievalAgentUrl(account.slug, arag.slug));
          return arag;
        }),
        switchMap((arag) => arag.getDrivers('nucliadb') as Observable<NucliaDBDriver[]>),
        map((drivers) =>
          drivers.map((driver) => new OptionModel({ id: driver.id, label: driver.name, value: driver.config.kbid })),
        ),
      )
      .subscribe((options) => this.sourceOptions.set(options));
  }
}
