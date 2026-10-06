import { CommonModule } from '@angular/common';
import { Component, ElementRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { FeaturesService, UploadService } from '@flaps/core';
import { PaButtonModule, PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { TranslatePipe } from '@ngx-translate/core';
import { BadgeComponent } from '@nuclia/sistema';

@Component({
  selector: 'stf-data-page',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    CommonModule,
    BadgeComponent,
    PaButtonModule,
    PaTabsModule,
    TranslatePipe,
  ],
  templateUrl: './data-page.component.html',
  styleUrl: './data-page.component.scss',
})
export class DataPageComponent {
  private elementRef = inject(ElementRef<HTMLElement>);
  private features = inject(FeaturesService);
  private uploadService = inject(UploadService);

  isAgenticSearchEnabled = toSignal(this.features.unstable.agenticSearch, { initialValue: false });

  scrollUp() {
    this.elementRef.nativeElement.scrollIntoView();
  }

  refreshResources() {
    this.uploadService.updateAfterUploads().subscribe();
  }
}
