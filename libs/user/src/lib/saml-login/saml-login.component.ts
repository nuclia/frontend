import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BackendConfigurationService } from '@flaps/core';
import { isCameFromLegit } from '../login-error.util';

@Component({
  changeDetection: ChangeDetectionStrategy.Eager,
  template: '',
})
export class SamlLoginComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private config: BackendConfigurationService,
  ) {}

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
      window.location.href = target.toString();
    } catch {
      return;
    }
  }
}