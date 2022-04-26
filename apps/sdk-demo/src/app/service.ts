import { Injectable } from '@angular/core';
import { Nuclia } from '@nuclia/core';
import { environment } from '../environments/environment';

@Injectable({ providedIn: 'root' })
export class MyService {
  anonymous = false;
  nuclia: Nuclia;
  constructor() {
    this.nuclia = new Nuclia({ backend: environment.backend, zone: environment.zone });
  }

  reinit(anonymous = false) {
    if (anonymous !== this.anonymous) {
      if (anonymous) {
        this.nuclia.auth.logout();
        this.nuclia = new Nuclia({
          backend: environment.backend,
          zone: environment.zone,
          knowledgeBox: environment.knowledgeBox,
        });
      } else {
        this.nuclia = new Nuclia({
          backend: environment.backend,
          zone: environment.zone,
          account: environment.account,
        });
      }
      this.anonymous = anonymous;
    }
  }
}
