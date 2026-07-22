import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  OnInit,
  ViewChild,
  computed,
  inject,
  signal,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FeaturesService } from '@flaps/core';
import { ChatAdviceService } from './chat-advice.service';
import { ChatMessage, ChatState } from './chat-advice.models';

@Component({
  selector: 'stf-chat-advice-bubble',
  imports: [RouterLink, TranslateModule, PaButtonModule, PaIconModule, PaTooltipModule],
  host: {
    '[class.minimized]': 'isMinimized()',
  },
  templateUrl: './chat-advice-bubble.component.html',
  styleUrl: './chat-advice-bubble.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ChatAdviceBubbleComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  private chatAdviceService = inject(ChatAdviceService);
  private translate = inject(TranslateService);
  private features = inject(FeaturesService);

  private readonly MINIMIZED_KEY = 'HELP_ASSISTANT_MINIMIZED';
  private readonly bookDemoUrl = 'https://www.progress.com/agentic-rag/book-a-demo';

  @ViewChild('messagesList') private messagesList?: ElementRef<HTMLDivElement>;

  isOpen = signal(false);
  isMinimized = signal(localStorage.getItem(this.MINIMIZED_KEY) === 'true');
  state = signal<ChatState>('idle');
  messages = signal<ChatMessage[]>([]);
  inputValue = signal('');
  errorMessage = signal<string | null>(null);

  hasUserMessages = computed(() => this.messages().some((m) => m.role === 'user'));

  showBookDemoPill = toSignal(this.features.authorized.showDemoButton, { initialValue: false });

  ngOnInit(): void {
    this.translate
      .get('chat-advice.welcome-message')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((welcomeMsg) => {
        this.messages.set([{ role: 'assistant', content: welcomeMsg }]);
      });
  }

  openPanel(): void {
    this.isMinimized.set(false);
    this.isOpen.set(true);
  }

  openFromMinimized(): void {
    localStorage.removeItem(this.MINIMIZED_KEY);
    this.isMinimized.set(false);
    this.isOpen.set(true);
  }

  minimizePanel(): void {
    localStorage.setItem(this.MINIMIZED_KEY, 'true');
    this.isOpen.set(false);
    this.isMinimized.set(true);
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
    setTimeout(() => this.scrollToLatestResponse());

    this.chatAdviceService
      .ask(userMessage, previousMessages)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (message) => {
          this.messages.update((messages) => [...messages, message]);
          this.state.set('answered');
          setTimeout(() => this.scrollToLatestResponse());
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

  openBookDemoPill(): void {
    window.open(this.bookDemoUrl, '_blank', 'noreferrer');
  }

  private scrollToLatestResponse(): void {
    const list = this.messagesList?.nativeElement;
    if (!list) return;

    const lastMessage = list.querySelector<HTMLElement>('.message.assistant:last-child');
    if (!lastMessage) {
      list.scrollTop = list.scrollHeight;
      return;
    }

    const PADDING = 16;
    const listRect = list.getBoundingClientRect();
    const msgRect = lastMessage.getBoundingClientRect();

    if (msgRect.height >= list.clientHeight - PADDING * 2) {
      // Tall message: scroll so its top sits at the top of the list with padding.
      list.scrollTop += msgRect.top - listRect.top - PADDING;
    } else {
      list.scrollTop = list.scrollHeight;
    }
  }
}
