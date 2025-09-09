import { computed, Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class DashboardLayoutService {
  private _collapsedNav = signal(false);
  collapsedNav = computed(() => this._collapsedNav());

  toggleNav() {
    this._collapsedNav.set(!this._collapsedNav());
  }
}
