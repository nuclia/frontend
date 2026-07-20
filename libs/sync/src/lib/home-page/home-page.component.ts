import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, inject, OnInit, signal, ViewChild } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { PaTabsModule } from '@guillotinaweb/pastanaga-angular';
import { SynchronizeComponent } from './synchronize';
import { ConnectComponent } from './connect';
import { ActivatedRoute } from '@angular/router';
import { take } from 'rxjs';

@Component({
  imports: [CommonModule, ConnectComponent, SynchronizeComponent, PaTabsModule, TranslateModule],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomePageComponent implements OnInit {
  private route = inject(ActivatedRoute);

  @ViewChild('topAnchor') topAnchor?: ElementRef<HTMLElement>;

  selectedTab = signal<'synchronize' | 'connect'>('synchronize');

  selectTab(tab: 'synchronize' | 'connect') {
    this.selectedTab.set(tab);
    this.topAnchor?.nativeElement.scrollIntoView();
  }

  ngOnInit() {
    this.route.queryParams.pipe(take(1)).subscribe((params) => {
      if (params['tab'] === 'connect') {
        this.selectedTab.set('connect');
      }
    });
  }
}
