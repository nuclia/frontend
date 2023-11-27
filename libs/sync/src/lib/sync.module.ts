import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutModule } from './main-layout/main-layout.module';

import { HistoryModule } from './history/history.module';
import { HomeModule } from './home/home.module';
import { ServerSelectionModule } from './server-selection/server-selection.module';
import { SyncRoutingModule } from './sync-routing.module';
import { UploadModule } from './upload/upload.module';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    HistoryModule,
    HomeModule,
    MainLayoutModule,
    ServerSelectionModule,
    SyncRoutingModule,
    UploadModule,
  ]
})
export class SyncModule { }
