import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  EventEmitter,
  inject,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { PaTextFieldModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ReasoningConfig } from '@nuclia/core';

@Component({
  selector: 'stf-reasoning-config',
  imports: [PaTextFieldModule, PaTogglesModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './reasoning-config.component.html',
  styleUrls: ['./reasoning-config.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReasoningConfigComponent implements OnDestroy {
  private destroyRef = inject(DestroyRef);

  @Input()
  set config(value: ReasoningConfig | undefined) {
    this.updateForm(value);
  }
  @Input()
  set disabled(value: boolean | undefined) {
    value ? this.form.disable() : this.form.enable();
  }
  @Output() configChange = new EventEmitter<ReasoningConfig>();

  get isCustomReasoning() {
    return this.form.controls.customizeReasoning.value;
  }

  form = new FormGroup({
    customizeReasoning: new FormControl<boolean>(false, { nonNullable: true }),
    budget_tokens: new FormControl<number>(0, { nonNullable: true }),
    effort: new FormControl<string>('0', { nonNullable: true }), // effort property is integer, but pastanaga select only accept strings
  });

  unsubscribeAll = new Subject<void>();

  constructor() {
    this.form.valueChanges.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((values) => {
      this.configChange.emit(
        values.customizeReasoning
          ? {
              budget_tokens: typeof values.budget_tokens === 'number' ? values.budget_tokens : undefined,
              effort: typeof values.effort === 'string' ? parseInt(values.effort) : undefined,
            }
          : undefined,
      );
    });
  }

  ngOnDestroy() {
    this.unsubscribeAll.next();
    this.unsubscribeAll.complete();
  }

  updateForm(value: ReasoningConfig | undefined) {
    const noValues = value === undefined || (value?.budget_tokens === 0 && value?.effort === 0 && this.form.pristine);
    if (noValues) {
      this.form.patchValue({ customizeReasoning: false }, { emitEvent: false });
      return;
    } else {
      this.form.patchValue(
        {
          customizeReasoning: true,
          budget_tokens: value.budget_tokens || 0,
          effort: value.effort?.toString() || '0',
        },
        { emitEvent: false },
      );
    }
  }
}
