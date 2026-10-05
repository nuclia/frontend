import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService } from '@flaps/core';
import { isCameFromLegit } from '../login-error.util';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export class SamlLoginComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private config = inject(BackendConfigurationService);
  private document = inject(DOCUMENT);

  ngOnInit(): void {
    const { ref, nonce, came_from } = this.route.snapshot.queryParams;
    if (!ref || !nonce || !came_from) return;

    try {
      const target = new URL(came_from);
      if (
        !['http:', 'https:'].includes(target.protocol) ||
        target.username ||
        target.password ||
        !isCameFromLegit(came_from, this.config.getAPIOrigin())
      ) {
        return;
      }

      target.pathname = '/';
      target.search = '';
      target.hash = '';
      target.searchParams.set('saml_ref', ref);
      target.searchParams.set('nonce', nonce);
      target.searchParams.set('came_from', came_from);
      this.document.location.href = target.toString();
    } catch {
      return;
    }
  }
}