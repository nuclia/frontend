import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  OnInit,
  Output,
} from '@angular/core';
import { FormArray, FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PaButtonModule, PaSliderModule, PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { GenerativeProviders, LearningConfigurations, Widget } from '@nuclia/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SearchWidgetStorageService } from '../../search-widget-storage.service';
import { ModelSelectorComponent } from '../../../ai-models';

@Component({
  selector: 'stf-routing-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    TranslateModule,
    PaTogglesModule,
    PaTextFieldModule,
    InfoCardComponent,
    BadgeComponent,
    PaSliderModule,
    PaButtonModule,
    ExpandableTextareaComponent,
    ModelSelectorComponent,
  ],
  templateUrl: './routing-form.component.html',
  styleUrls: ['./routing-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutingFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private searchWidgetStorage = inject(SearchWidgetStorageService);
  private cdr = inject(ChangeDetectorRef);
  private configPatchTimer: ReturnType<typeof setTimeout> | null = null;
  searchConfigs = this.searchWidgetStorage.searchAPIConfigs.pipe(
    map((configs) => Object.entries(configs).map(([id, config]) => ({ id, kind: config.kind }))),
  );

  @Input() set config(value: Widget.RoutingConfig | undefined) {
    const rulesArray = this.form.controls.routing.controls.rules;
    // Always clear first to prevent accumulation across config switches
    rulesArray.clear({ emitEvent: false });

    // Cancel any pending delayed patch (race condition guard)
    if (this.configPatchTimer) {
      clearTimeout(this.configPatchTimer);
      this.configPatchTimer = null;
    }

    if (value) {
      for (let i = 0; i < (value.routing?.rules || []).length; i++) {
        // emitEvent: false — no intermediate configChanged emissions during setup
        rulesArray.push(this.createRuleGroup(), { emitEvent: false });
      }
      // Delay the value patch so the config selects are updated according to the kind
      this.configPatchTimer = setTimeout(() => {
        this.configPatchTimer = null;
        this.form.patchValue(value);
        this.cdr.markForCheck();
      }, 500);
    } else {
      this.form.reset();
      this.cdr.markForCheck();
    }
  }
  private _kind = '';
  @Input() get kind(): string {
    return this._kind;
  }
  set kind(value: string) {
    this._kind = value;
  }

  @Input({ required: true }) generativeProviders: GenerativeProviders = {};
  @Input({ required: true }) learningConfigurations: LearningConfigurations = {};

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.RoutingConfig>();

  form = new FormGroup({
    useRouting: new FormControl<boolean>(false, { nonNullable: true }),
    routing: new FormGroup({
      generative_model: new FormControl<string>('', { nonNullable: true }),
      direct_answer: new FormControl<string>('', { nonNullable: true }),
      rules: new FormArray<
        FormGroup<{
          search_config: FormControl<string>;
          prompt: FormControl<string>;
        }>
      >([]),
    }),
  });

  get rulesControls() {
    return this.form.controls.routing.controls.rules.controls;
  }

  get useRouting() {
    return this.form.controls.useRouting.value;
  }

  ngOnInit() {
    this.form.valueChanges.pipe(takeUntil(this.unsubscribeAll)).subscribe(() => {
      this.configChanged.emit(this.form.getRawValue());
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
    if (this.configPatchTimer) {
      clearTimeout(this.configPatchTimer);
    }
  }

  addRule() {
    this.form.controls.routing.controls.rules.push(this.createRuleGroup());
  }

  removeRule(index: number) {
    this.form.controls.routing.controls.rules.removeAt(index);
  }

  private createRuleGroup() {
    return new FormGroup({
      search_config: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
      prompt: new FormControl<string>('', { nonNullable: true }),
    });
  }
}
