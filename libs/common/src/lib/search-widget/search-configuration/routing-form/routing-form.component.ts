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
import { takeUntil } from 'rxjs/operators';
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
  searchConfigs: string[] = [];

  @Input() set config(value: Widget.RoutingConfig | undefined) {
    if (value) {
      for (let i = 0; i < (value.routing?.rules || []).length; i++) {
        this.addRule();
      }
      setTimeout(() => {
        this.form.patchValue(value);
        this.cdr.markForCheck();
      }, 200);
    }
  }
  @Input() set kind(value: string) {
    this.searchWidgetStorage.getSearchConfigIdsByType(value).subscribe((ids) => {
      this.searchConfigs = ids;
      this.cdr.markForCheck();
    });
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
