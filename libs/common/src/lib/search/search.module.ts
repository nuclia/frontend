import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SearchComponent } from './search.component';
import { PaIconModule, PaTogglesModule, PaTranslateModule } from '@guillotinaweb/pastanaga-angular';

@NgModule({
  imports: [CommonModule, PaTogglesModule, PaTranslateModule, PaIconModule],
  declarations: [SearchComponent],
  exports: [SearchComponent],
})
export class SearchModule {}
