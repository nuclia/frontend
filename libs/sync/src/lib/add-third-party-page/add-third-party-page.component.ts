import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTextFieldModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { BackButtonComponent, StickyFooterComponent } from '@nuclia/sistema';
import { KbConnectionsService } from '@flaps/common';

const THIRD_PARTY_APPS: Record<string, { logo: string; titleKey: string; descriptionKey: string }> = {
  perplexity: {
    logo: 'assets/connector-logos/perplexity.svg',
    titleKey: 'sync.home-page.connect.third-party.perplexity.add-title',
    descriptionKey: 'sync.home-page.connect.third-party.perplexity.description',
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

  /**
   * Tracks whether the user has gone through the authentication step.
   * Set to true by authenticate().
   *
   * TODO: In the real implementation, authenticate() should open a popup window
   * pointing to the third-party OAuth URL (e.g. window.open(oauthUrl, '_blank', 'popup=yes')).
   * Once auth completes, the popup should postMessage back to this window and
   * authenticate() should set this signal to true in the message handler.
   * Example:
   *   window.addEventListener('message', (event) => {
   *     if (event.origin === EXPECTED_ORIGIN && event.data?.type === 'AUTH_SUCCESS') {
   *       this.authenticated.set(true);
   *       this.cdr.markForCheck();
   *     }
   *   });
   */
  authenticated = signal(false);

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

  /**
   * Placeholder for the authentication step.
   * In production this should open the third-party OAuth window before revealing the form.
   */
  authenticate() {
    this.authenticated.set(true);
  }

  connect() {
    if (this.connectForm.invalid) {
      return;
    }
    const { name, description } = this.connectForm.getRawValue();
    this.connectionsService.addOrUpdate({
      id: crypto.randomUUID(),
      type: 'perplexity',
      label: name,
      description,
    });
    this.router.navigate([this.backPath], { relativeTo: this.currentRoute });
  }
}
