import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { shareReplay, switchMap, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { NavigationService, SDKService } from '@flaps/core';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-extraction-select',
  templateUrl: './extraction-select.component.html',
  styleUrls: ['./extraction-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, InfoCardComponent, PaTogglesModule, PaTextFieldModule, RouterModule, TranslateModule],
})
export class ExtractionSelectComponent<T> {
  sdk = inject(SDKService);
  navigationService = inject(NavigationService);
  enabled: boolean = false;

  private _configId: string | undefined;
  @Input() set configId(value: string | undefined) {
    this._configId = value;
    this.enabled = !!value;
  }
  get configId() {
    return this._configId;
  }
  @Output() configIdChange = new EventEmitter<string | undefined>();
  @Output() heightChange = new EventEmitter<void>();
  @Output() close = new EventEmitter<void>();

  kbUrl = this.navigationService.kbUrl;
  extractStrategies = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getExtractStrategies()),
    shareReplay(1),
  );

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.configIdChange.emit(undefined);
    }
    this.heightChange.emit();
  }

  selectConfigId(configId: string) {
    this.configIdChange.emit(configId);
    this.heightChange.emit();
  }
}
