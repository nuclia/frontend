import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { FileUploadModule } from '@flaps/core';
import { NsiSkeletonComponent, SisIconsModule, SisProgressModule } from '@nuclia/sistema';
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
import { SimplePageRoutingModule } from './simple-page-routing.module';

@NgModule({
  declarations: [
    SimplePageComponent,
    SimpleKBComponent,
    ReaderExperienceComponent,
    HistoryTableComponent,
    ResourceTableComponent,
    McpEndpointModalComponent,
  ],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    SimplePageRoutingModule,
    TranslateModule.forChild(),
    FileUploadModule,
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
