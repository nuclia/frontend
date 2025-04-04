import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-info-block',
  imports: [CommonModule, TranslateModule],
  templateUrl: './info-block.component.html',
  styleUrl: './info-block.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfoBlockComponent implements AfterViewInit {
  @ViewChild('content') content?: ElementRef;

  hasContent = signal(false);

  ngAfterViewInit(): void {
    if (this.content) {
      this.hasContent.set(this.content.nativeElement.children.length > 0 || !!this.content.nativeElement.textContent);
    }
  }
}
