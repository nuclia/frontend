import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
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

import { ContextBoxPageRoutingModule } from './context-box-page-routing.module';
import { ContextBoxPageComponent } from './context-box-page.component';
import { ContextBoxComponent } from './context-box/context-box.component';
import { HistoryTableModalComponent } from './history-table/history-table-modal.component';
import { HistoryTableComponent } from './history-table/history-table.component';
import { McpEndpointModalComponent } from './mcp-endpoint/mcp-endpoint-modal.component';
import { ReaderExperienceComponent } from './reader-experience/reader-experience.component';
import { ResourceTableModalComponent } from './resource-table/resource-table-modal.component';
import { ResourceTableComponent } from './resource-table/resource-table.component';
import { TrialExpiredModalComponent } from './trial-expired-modal/trial-expired-modal.component';

@NgModule({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ContextBoxPageRoutingModule,
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
    ContextBoxPageComponent,
    ContextBoxComponent,
    ReaderExperienceComponent,
    HistoryTableComponent,
    ResourceTableComponent,
    HistoryTableModalComponent,
    ResourceTableModalComponent,
    McpEndpointModalComponent,
    TrialExpiredModalComponent,
  ],
})
export class ContextBoxPageModule {}
