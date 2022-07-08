import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FileUploadModule } from '@flaps/core';
import { TranslateModule } from '@ngx-translate/core';

import { FolderUploadComponent } from './folder-upload.component';

@NgModule({
  imports: [
    CommonModule,
    TranslateModule,
    FileUploadModule,
  ],
  exports: [FolderUploadComponent],
  declarations: [FolderUploadComponent],
  providers: [],
})
export class FolderUploadModule {}
