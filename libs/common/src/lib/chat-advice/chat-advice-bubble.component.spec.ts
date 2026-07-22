import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MockModule, MockProvider } from 'ng-mocks';
import { of, throwError } from 'rxjs';
import { RouterModule } from '@angular/router';
import { PaButtonModule, PaIconModule, PaTooltipModule } from '@guillotinaweb/pastanaga-angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FeaturesService } from '@flaps/core';

import { ChatAdviceBubbleComponent } from './chat-advice-bubble.component';
import { ChatAdviceService } from './chat-advice.service';
import { ChatMessage } from './chat-advice.models';

describe('ChatAdviceBubbleComponent', () => {
  let component: ChatAdviceBubbleComponent;
  let fixture: ComponentFixture<ChatAdviceBubbleComponent>;
  let chatAdviceService: ChatAdviceService;

  const setup = async (showDemoButton: boolean) => {
    await TestBed.configureTestingModule({
      imports: [
        ChatAdviceBubbleComponent,
        MockModule(RouterModule),
        MockModule(PaButtonModule),
        MockModule(PaIconModule),
        MockModule(PaTooltipModule),
        MockModule(TranslateModule),
      ],
      providers: [
        MockProvider(TranslateService, {
          instant: (key: string) => key,
          get: (key: string) => of(key),
        }),
        MockProvider(ChatAdviceService, {
          ask: jest.fn(),
        }),
        MockProvider(FeaturesService, {
          authorized: { showDemoButton: of(showDemoButton) } as unknown as FeaturesService['authorized'],
        }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatAdviceBubbleComponent);
    component = fixture.componentInstance;
    chatAdviceService = TestBed.inject(ChatAdviceService);
    fixture.detectChanges();
  };

  afterEach(() => {
    localStorage.clear();
  });

  describe('when the demo-button feature is enabled', () => {
    beforeEach(async () => {
      await setup(true);
    });

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should show the book-demo pill before any user message has been sent', () => {
      expect(component.showBookDemoPill()).toBe(true);
      expect(component.hasUserMessages()).toBe(false);
    });

    it('should hide the book-demo pill once the user has sent a message', () => {
      component.updateInput({ target: { value: 'hello' } } as unknown as Event);
      jest.spyOn(chatAdviceService, 'ask').mockReturnValue(of({ role: 'assistant', content: 'hi' } as ChatMessage));

      component.sendMessage();

      expect(component.hasUserMessages()).toBe(true);
    });

    it('should open the book-demo URL in a new tab', () => {
      jest.spyOn(window, 'open').mockImplementation(() => null);

      component.openBookDemoPill();

      expect(window.open).toHaveBeenCalledWith(
        'https://www.progress.com/agentic-rag/book-a-demo',
        '_blank',
        'noreferrer',
      );
    });
  });

  describe('when the demo-button feature is disabled', () => {
    beforeEach(async () => {
      await setup(false);
    });

    it('should not show the book-demo pill', () => {
      expect(component.showBookDemoPill()).toBe(false);
    });
  });

  describe('sendMessage()', () => {
    beforeEach(async () => {
      await setup(true);
    });

    it('should ignore blank input', () => {
      component.updateInput({ target: { value: '   ' } } as unknown as Event);

      component.sendMessage();

      expect(chatAdviceService.ask).not.toHaveBeenCalled();
    });

    it('should append the assistant response and set state to answered', () => {
      component.updateInput({ target: { value: 'hello' } } as unknown as Event);
      jest.spyOn(chatAdviceService, 'ask').mockReturnValue(of({ role: 'assistant', content: 'hi there' }));

      component.sendMessage();

      expect(component.state()).toBe('answered');
      expect(component.messages().at(-1)).toEqual({ role: 'assistant', content: 'hi there' });
    });

    it('should set state to error and expose the error message when the service call fails', () => {
      component.updateInput({ target: { value: 'hello' } } as unknown as Event);
      jest.spyOn(chatAdviceService, 'ask').mockReturnValue(throwError(() => new Error('boom')));

      component.sendMessage();

      expect(component.state()).toBe('error');
      expect(component.errorMessage()).toBe('boom');
    });
  });
});
