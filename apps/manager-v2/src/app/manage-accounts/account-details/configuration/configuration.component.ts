import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { AccountTypes, WorkflowType } from '@nuclia/core';
import { HlmButtonImports } from '@nuclia/ui-spartan/button';
import { HlmDatePickerImports } from '@nuclia/ui-spartan/date-picker';
import { HlmFieldImports } from '@nuclia/ui-spartan/field';
import { HlmInputImports } from '@nuclia/ui-spartan/input';
import { HlmSelectImports } from '@nuclia/ui-spartan/select';
import { HlmSwitchImports } from '@nuclia/ui-spartan/switch';
import { HlmTooltipImports } from '@nuclia/ui-spartan/tooltip';
import { ZONE_VISIBILITY_OPTIONS, ZoneVisibility } from '../../../manage-zones/zone.models';
import { FormFooterComponent } from '../../form-footer/form-footer.component';
import { BlockedFeaturesComponent } from '../blocked-features/blocked-features.component';
import { BudgetFieldComponent } from './budget-field/budget-field.component';
import { ConfigurationService } from './configuration.service';
import { getOptionLabel } from '../account-details.utils';
import { ACCOUNT_TYPE_OPTIONS, WORKFLOW_OPTIONS } from './configuration.utils';
import { LimitFieldComponent } from './limit-field/limit-field.component';

@Component({
  templateUrl: './configuration.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    HlmButtonImports,
    HlmDatePickerImports,
    HlmFieldImports,
    HlmInputImports,
    HlmSelectImports,
    HlmSwitchImports,
    HlmTooltipImports,
    FormFooterComponent,
    BlockedFeaturesComponent,
    BudgetFieldComponent,
    LimitFieldComponent,
  ],
  providers: [ConfigurationService],
})
export class ConfigurationComponent {
  protected vm = inject(ConfigurationService);

  protected readonly accountTypeOptions = ACCOUNT_TYPE_OPTIONS;
  protected readonly workflowOptions = WORKFLOW_OPTIONS;
  protected readonly zoneVisibilityOptions = ZONE_VISIBILITY_OPTIONS;
  protected readonly accountTypeLabel = (value: AccountTypes) => getOptionLabel(ACCOUNT_TYPE_OPTIONS, value);
  protected readonly workflowLabel = (value: WorkflowType) => getOptionLabel(WORKFLOW_OPTIONS, value);
  protected readonly zoneVisibilityLabel = (value: ZoneVisibility) => getOptionLabel(ZONE_VISIBILITY_OPTIONS, value);
}
