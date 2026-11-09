import { KeyValuePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { LimitRowComponent } from './limit-row/limit-row.component';
import { LimitsService } from './limits.service';

@Component({
  templateUrl: './limits.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [LimitsService],
  imports: [ReactiveFormsModule, HlmButtonImports, FormFooterComponent, KeyValuePipe, LimitRowComponent],
})
export class LimitsComponent {
  protected vm = inject(LimitsService);
}
