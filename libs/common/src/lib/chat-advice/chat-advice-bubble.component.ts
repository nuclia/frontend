import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PaButtonModule, PaIconModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChatAdviceService } from './chat-advice.service';
import { ChatMessage, ChatState } from './chat-advice.models';

@Component({
  selector: 'stf-chat-advice-bubble',
  imports: [RouterLink, TranslateModule, PaButtonModule, PaIconModule],
  templateUrl: './chat-advice-bubble.component.html',
  styleUrl: './chat-advice-bubble.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAdviceBubbleComponent {
  private destroyRef = inject(DestroyRef);
  private chatAdviceService = inject(ChatAdviceService);
  private translate = inject(TranslateService);

  isOpen = signal(false);
  state = signal<ChatState>('idle');
  messages = signal<ChatMessage[]>([]);
  inputValue = signal('');
  errorMessage = signal<string | null>(null);

  openPanel(): void {
    this.isOpen.set(true);
  }

  closePanel(): void {
    this.isOpen.set(false);
  }

  updateInput(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }

  sendMessage(): void {
    const userMessage = this.inputValue().trim();
    if (!userMessage || this.state() === 'thinking') {
      return;
    }

    const previousMessages = this.messages();
    this.inputValue.set('');
    this.errorMessage.set(null);
    this.messages.update((messages) => [...messages, { role: 'user', content: userMessage }]);
    this.state.set('thinking');

    this.chatAdviceService
      .ask(userMessage, previousMessages)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          this.messages.update((messages) => [...messages, message]);
          this.state.set('answered');
        },
        error: (error: Error) => {
          this.state.set('error');
          this.errorMessage.set(
            error.message === 'chat-advice.error'
              ? this.translate.instant('chat-advice.error')
              : error.message || this.translate.instant('chat-advice.error'),
          );
        },
      });
  }
}
