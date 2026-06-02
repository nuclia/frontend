import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule } from '@flaps/core';
import { InfoCardComponent, NsiSkeletonComponent, SisIconsModule, SisProgressModule } from '@nuclia/sistema';

import {
  PaButtonModule,
  PaDropdownModule,
  PaIconModule,
  PaModalModule,
  PaPopupModule,
  PaTableModule,
  PaTextFieldModule,
} from '@guillotinaweb/pastanaga-angular';

import { SimplePageComponent } from './simple-page.component';
import { SimpleKBComponent } from './simple-kb/simple-kb.component';
import { ReaderExperienceComponent } from './reader-experience/reader-experience.component';
import { HistoryTableComponent } from './history-table/history-table.component';
import { ResourceTableComponent } from './resource-table/resource-table.component';
import { McpEndpointModalComponent } from './mcp-endpoint/mcp-endpoint-modal.component';
import { TrialEquatorBannerComponent } from './trial-equator-banner/trial-equator-banner.component';
import { TrialEquatorModalComponent } from './trial-equator-banner/trial-equator-modal.component';
import { TrialExpiredModalComponent } from './trial-expired-modal/trial-expired-modal.component';
import { SimplePageRoutingModule } from './simple-page-routing.module';

@NgModule({
  declarations: [
    SimplePageComponent,
    SimpleKBComponent,
    ReaderExperienceComponent,
    HistoryTableComponent,
    ResourceTableComponent,
    McpEndpointModalComponent,
    TrialEquatorBannerComponent,
    TrialEquatorModalComponent,
    TrialExpiredModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SimplePageRoutingModule,
    TranslateModule.forChild(),
    FileUploadModule,
    InfoCardComponent,
    NsiSkeletonComponent,
    SisIconsModule,
    PaButtonModule,
    PaDropdownModule,
    PaIconModule,
    PaModalModule,
    PaPopupModule,
    PaTableModule,
    PaTextFieldModule,
    SisProgressModule,
  ],
})
export class SimplePageModule {}
