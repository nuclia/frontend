import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BackButtonComponent, StickyFooterComponent } from '@nuclia/sistema';
import { KbConnectionsService, KbConnectionType } from '@flaps/common';

const THIRD_PARTY_APPS: Record<string, { logo: string; titleKey: string; descriptionKey: string }> = {
  'perplexity-search': {
    logo: 'assets/connector-logos/perplexity.svg',
    titleKey: 'sync.home-page.connect.third-party.perplexity-search.add-title',
    descriptionKey: 'sync.home-page.connect.third-party.perplexity-search.description',
  },
  'perplexity-answer': {
    logo: 'assets/connector-logos/perplexity.svg',
    titleKey: 'sync.home-page.connect.third-party.perplexity-answer.add-title',
    descriptionKey: 'sync.home-page.connect.third-party.perplexity-answer.description',
  },
  gemini: {
    logo: 'assets/connector-logos/gemini.svg',
    titleKey: 'sync.home-page.connect.third-party.gemini.add-title',
    descriptionKey: 'sync.home-page.connect.third-party.gemini.description',
  },
};

@Component({
  selector: 'nsy-add-third-party-page',
  imports: [
    BackButtonComponent,
    PaButtonModule,
    PaIconModule,
    PaTextFieldModule,
    ReactiveFormsModule,
    StickyFooterComponent,
    TranslateModule,
  ],
  templateUrl: './add-third-party-page.component.html',
  styleUrl: './add-third-party-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddThirdPartyPageComponent {
  private currentRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private connectionsService = inject(KbConnectionsService);

  readonly appId = this.currentRoute.snapshot.params['appId'] as string;
  readonly app = THIRD_PARTY_APPS[this.appId];

  connectForm = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  get backPath() {
    return '../..';
  }

  cancel() {
    this.router.navigate([this.backPath], { relativeTo: this.currentRoute });
  }

  connect() {
    if (this.connectForm.invalid) {
      return;
    }
    const { name, description } = this.connectForm.getRawValue();
    this.connectionsService.addOrUpdate({
      id: crypto.randomUUID(),
      type: this.appId as KbConnectionType,
      label: name,
      description,
    });
    this.router.navigate([this.backPath], { relativeTo: this.currentRoute });
  }
}
