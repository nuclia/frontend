import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { InfoCardComponent } from '@nuclia/sistema';
import { PaIconModule, PaPopupModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { shareReplay, switchMap, take } from 'rxjs';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { SDKService } from '@flaps/core';

@Component({
  selector: 'app-extraction-select',
  templateUrl: './extraction-select.component.html',
  styleUrls: ['./extraction-select.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    InfoCardComponent,
    PaIconModule,
    PaPopupModule,
    PaTogglesModule,
    PaTextFieldModule,
    TranslateModule,
  ],
})
export class ExtractionSelectComponent<T> {
  sdk = inject(SDKService);
  enabled: boolean = false;

  private _extractConfig: string | undefined;
  @Input() set extractConfig(value: string | undefined) {
    this._extractConfig = value;
    if (value) {
      this.enabled = true;
    }
  }
  get extractConfig() {
    return this._extractConfig;
  }

  private _splitConfig: string | undefined;
  @Input() set splitConfig(value: string | undefined) {
    this._splitConfig = value;
    if (value) {
      this.enabled = true;
    }
  }
  get splitConfig() {
    return this._splitConfig;
  }
  @Input() onlyExtract: boolean = false;
  @Output() extractConfigChange = new EventEmitter<string | undefined>();
  @Output() splitConfigChange = new EventEmitter<string | undefined>();
  @Output() heightChange = new EventEmitter<void>();

  extractStrategies = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getExtractStrategies()),
    shareReplay(1),
  );
  splitStrategies = this.sdk.currentKb.pipe(
    take(1),
    switchMap((kb) => kb.getSplitStrategies()),
    shareReplay(1),
  );

  toggle() {
    this.enabled = !this.enabled;
    if (!this.enabled) {
      this.extractConfigChange.emit(undefined);
      this.splitConfigChange.emit(undefined);
    }
    this.heightChange.emit();
  }

  selectExtractConfig(id: string) {
    if (this.extractConfig !== id) {
      this.extractConfigChange.emit(id);
      this.heightChange.emit();
    }
  }

  selectSplitConfig(id: string) {
    if (this.splitConfig !== id) {
      this.splitConfigChange.emit(id);
      this.heightChange.emit();
    }
  }
}
