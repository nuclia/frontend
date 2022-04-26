import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OverlayModule } from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { MatDialogModule } from '@angular/material/dialog';
import { STFConfirmModule } from '@flaps/components';
import { STFButtonsModule, STFInputModule, STFExpanderModule, STFTooltipModule, STFTextFieldModule } from '@flaps/pastanaga';
import { ButtonActionModule } from '../components/button-action/button-action.module';

import { EntitiesComponent } from './entities.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { EntityGroupComponent } from './entity-group/entity-group.component';
import { EntityNameComponent } from './entity-name/entity-name.component';
import { SynonymListComponent } from './synonym-list/synonym-list.component';
import { SynonymAddComponent } from './synonym-add/synonym-add.component';
import { EntityDialogComponent } from './entity-dialog/entity-dialog.component';
import { GroupSelectComponent } from './entity-dialog/group-select/group-select.component';

const Components = [
  EntitiesComponent,
  EntityGroupComponent,
  EntityListComponent,
  EntityNameComponent,
  SynonymListComponent,
  SynonymAddComponent,
  EntityDialogComponent,
  GroupSelectComponent,
]

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule,
    ButtonActionModule,
    ScrollingModule,
    OverlayModule,
    A11yModule,
    MatDialogModule,
    STFConfirmModule,
    STFButtonsModule,
    STFInputModule,
    STFTextFieldModule,
    STFExpanderModule,
    STFTooltipModule,
  ],
  declarations: [...Components],
  exports: [],
})
export class EntitiesModule {}
