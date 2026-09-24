import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { InfoCardComponent, NsiSkeletonComponent } from '@nuclia/sistema';

import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
  PaTooltipModule,
} from '@guillotinaweb/pastanaga-angular';

import { HistoryTableComponent } from './history-table/history-table.component';
import { McpEndpointModalComponent } from './mcp-endpoint/mcp-endpoint-modal.component';
import { ReaderExperienceComponent } from './reader-experience/reader-experience.component';
import { ResourceTableComponent } from './resource-table/resource-table.component';
import { SimpleKBComponent } from './simple-kb/simple-kb.component';
import { SimplePageRoutingModule } from './simple-page-routing.module';
import { SimplePageComponent } from './simple-page.component';
import { TrialExpiredModalComponent } from './trial-expired-modal/trial-expired-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SimplePageRoutingModule,
    TranslateModule.forChild(),
    InfoCardComponent,
    NsiSkeletonComponent,
    PaButtonModule,
    PaDropdownModule,
    PaIconModule,
    PaModalModule,
    PaPopupModule,
    PaTableModule,
    PaTextFieldModule,
    PaTooltipModule,
    SimplePageComponent,
    SimpleKBComponent,
    ReaderExperienceComponent,
    HistoryTableComponent,
    ResourceTableComponent,
    McpEndpointModalComponent,
    TrialExpiredModalComponent,
  ],
})
export class SimplePageModule {}
