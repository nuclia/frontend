import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SyncRoutingModule } from './sync-routing.module';
import { UploadModule } from './upload/upload.module';
import { ServerSetupModule } from './server-selection/server-setup.module';

/**
 * @deprecated
 * TODO: cleanup this code
 */
@NgModule({
  imports: [CommonModule, SyncRoutingModule, UploadModule, ServerSetupModule],
})
export class SyncModule {}
