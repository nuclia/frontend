import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { PaTogglesModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, PaTogglesModule, PaTranslateModule],
  declarations: [SearchComponent],
  exports: [SearchComponent],
})
export class SearchModule {}
