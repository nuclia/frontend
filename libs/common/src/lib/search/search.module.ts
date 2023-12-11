import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { PaIconModule, PaTogglesModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  imports: [CommonModule, PaTogglesModule, TranslateModule, PaIconModule],
  declarations: [SearchComponent],
  exports: [SearchComponent],
})
export class SearchModule {}
