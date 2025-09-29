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
import {
  OptionModel,
  PaButtonModule,
  PaSliderModule,
  PaTextFieldModule,
  PaTogglesModule,
} from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Widget } from '@nuclia/core';
import { BadgeComponent, ExpandableTextareaComponent, InfoCardComponent } from '@nuclia/sistema';
import { Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { SearchWidgetStorageService } from '../../search-widget-storage.service';

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
  ],
  templateUrl: './routing-form.component.html',
  styleUrls: ['./routing-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RoutingFormComponent implements OnInit, OnDestroy {
  private unsubscribeAll = new Subject<void>();
  private searchWidgetStorage = inject(SearchWidgetStorageService);
  private cdr = inject(ChangeDetectorRef);
  searchConfigs = this.searchWidgetStorage.searchAPIConfigs.pipe(
    map((configs) =>
      Object.entries(configs)
        .filter(([id, config]) => config.kind === this.kind)
        .map(([id]) => id),
    ),
  );

  @Input() set config(value: Widget.RoutingConfig | undefined) {
    if (value) {
      for (let i = 0; i < (value.routing?.rules || []).length; i++) {
        this.addRule();
      }
      // delay the value patch so the config selects are updated according the kind
      setTimeout(() => {
        this.form.patchValue(value);
        this.cdr.markForCheck();
      }, 500);
    } else {
      this.form.reset();
      this.cdr.markForCheck();
    }
  }
  private _kind: string = '';
  @Input() get kind(): string {
    return this._kind;
  }
  set kind(value: string) {
    this._kind = value;
  }

  @Input({ required: true }) generativeModels: OptionModel[] = [];

  @Output() heightChanged = new EventEmitter<void>();
  @Output() configChanged = new EventEmitter<Widget.RoutingConfig>();

  form = new FormGroup({
    useRouting: new FormControl<boolean>(false, { nonNullable: true }),
    routing: new FormGroup({
      generative_model: new FormControl<string>('', { nonNullable: true }),
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
  }

  addRule() {
    this.form.controls.routing.controls.rules.push(
      new FormGroup({
        search_config: new FormControl<string>('', { nonNullable: true, validators: [Validators.required] }),
        prompt: new FormControl<string>('', { nonNullable: true }),
      }),
    );
  }

  removeRule(index: number) {
    this.form.controls.routing.controls.rules.removeAt(index);
  }
}
