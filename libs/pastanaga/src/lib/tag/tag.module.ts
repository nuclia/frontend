import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { STFTagComponent } from './tag.component';
import { MatIconModule } from '@angular/material/icon';
import { MatLegacyButtonModule as MatButtonModule } from '@angular/material/legacy-button';

@NgModule({
  imports: [CommonModule, TranslateModule, MatIconModule, MatButtonModule],
  declarations: [STFTagComponent],
  exports: [STFTagComponent],
})
export class STFTagModule {}
