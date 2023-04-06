import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { AngularSvgIconModule } from 'angular-svg-icon';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { OverlayModule } from '@angular/cdk/overlay';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { A11yModule } from '@angular/cdk/a11y';

import { EntitiesComponent } from './entities.component';
import { EntityListComponent } from './entity-list/entity-list.component';
import { EntityGroupComponent } from './entity-group/entity-group.component';
import { EntityNameComponent } from './entity-name/entity-name.component';
import { SynonymListComponent } from './synonym-list/synonym-list.component';
import { SynonymAddComponent } from './synonym-add/synonym-add.component';
import { EntityDialogComponent, GroupSelectComponent } from './entity-dialog';
import {
  PaButtonModule,
  PaExpanderModule,
  PaIconModule,
  PaModalModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';
import { EntityGroupDialogComponent } from './entity-group-dialog/entity-group-dialog.component';
import { STFExpanderModule } from '@flaps/pastanaga';

const Components = [
  EntitiesComponent,
  EntityGroupComponent,
  EntityListComponent,
  EntityNameComponent,
  SynonymListComponent,
  SynonymAddComponent,
  EntityDialogComponent,
  GroupSelectComponent,
];

const ROUTES: Routes = [{ path: '', component: EntitiesComponent }];

@NgModule({
  imports: [
    CommonModule,
    AngularSvgIconModule,
    FlexLayoutModule,
    TranslateModule.forChild(),
    ReactiveFormsModule,
    RouterModule.forChild(ROUTES),
    ScrollingModule,
    OverlayModule,
    A11yModule,
    DragDropModule,
    PaTextFieldModule,
    PaButtonModule,
    PaIconModule,
    PaTooltipModule,
    PaModalModule,
    STFExpanderModule,
    PaExpanderModule,
  ],
  declarations: [...Components, EntityGroupDialogComponent],
  exports: [],
})
export class EntitiesModule {}
