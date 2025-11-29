import { useCallback, useEffect, useMemo, useRef, useState, type FC, type FormEvent, type MouseEvent } from 'react';
import { Icon } from '../Icon';
import { SessionHistory } from '../SessionHistory';
import { useSaoContext, useVoiceRecorder } from '../../hooks';
import { ISaoWidget } from './SaoWidget.interface';
import { SessionDrawer } from '../SessionDrawer';
import { Conversation } from '../Conversation';

const fallbackCards = [
  'Prompt Placeholder',
  'Prompt Placeholder',
  'Recent Chat Placeholder',
  'Recent Chat Placeholder',
];

const features = {
  addOns: false,
  sessionHistory: false,
};

export const SaoWidget: FC<ISaoWidget> = ({ title, userName, cards, inputPlaceholder, viewType = 'conversation' }) => {
  const { activeView, onChat } = useSaoContext();
  const { hasSupport: canUseVoice, isRecording, stopRecording, toggleRecording, transcript } = useVoiceRecorder();

  const [query, setQuery] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isFloating = viewType === 'floating';
  const useFloatingStyles = isFloating && !isExpanded;

  useEffect(() => {
    if (!isFloating) {
      setIsExpanded(false);
    }
  }, [isFloating]);

  const openDrawer = useCallback(() => {
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isDrawerOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeDrawer();
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  useEffect(() => {
    if (isDrawerOpen) {
      drawerRef.current?.focus();
    }
  }, [isDrawerOpen]);

  useEffect(() => {
    if (!transcript) {
      return;
    }

    setQuery(transcript);
  }, [transcript]);

  const displayCards = useMemo(() => {
    if (cards.length === 0) {
      return fallbackCards;
    }
    if (cards.length < 4) {
      return [...cards, ...fallbackCards.slice(cards.length, 4)];
    }
    return cards.slice(0, 4);
  }, [cards]);

  const handleCardClick = (event: MouseEvent<HTMLButtonElement>) => {
    const value = event.currentTarget.dataset.value ?? '';
    setQuery(value);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      return;
    }
    console.info('SAO widget demo submission', trimmed);
    setQuery('');
    stopRecording();

    onChat(trimmed);
  };

  const isConversationActive = useMemo(() => activeView === 'conversation', [activeView]);

  const containerClassName = useMemo(() => {
    const classes = ['sao-react'];
    if (isFloating) {
      classes.push(isExpanded ? 'sao-react--floating-expanded' : 'sao-react--floating');
    }
    return classes.join(' ');
  }, [isFloating, isExpanded]);

  const formClassName = useMemo(() => {
    const base = ['sao-react__form'];
    if (useFloatingStyles) {
      base.push('sao-react__form--floating');
    }
    return base.join(' ');
  }, [useFloatingStyles]);

  return (
    <div className={containerClassName}>
      <header className="sao-react__header">
        <span className="sao-react__brand">{title}</span>

        <div className="sao-react__header-actions">
          {isFloating && (
            <button
              type="button"
              className="sao-react__icon-button"
              aria-label={isExpanded ? 'Collapse chat' : 'Expand chat'}
              onClick={() => setIsExpanded((expanded) => !expanded)}>
              <Icon
                icon={isExpanded ? 'collapse' : 'expand'}
                size={'sm'}
              />
            </button>
          )}

          {features.sessionHistory && (
            <button
              type="button"
              className="sao-react__icon-button"
              aria-label="Open chat history"
              aria-expanded={isDrawerOpen}
              onClick={openDrawer}
              ref={triggerRef}>
              <Icon
                icon="submenu"
                size={'sm'}
              />
            </button>
          )}
        </div>
      </header>

      <main className={`sao-react__main sao-react__main--${activeView}`}>
        {isConversationActive ? (
          <Conversation />
        ) : (
          <>
            <h1 className="sao-react__greeting">Hello{userName ? `, ${userName}!` : '!'}</h1>
            <section
              className="sao-react__cards"
              aria-label="Suggested prompts">
              {displayCards.map((card, index) => (
                <button
                  key={`${card}-${index}`}
                  type="button"
                  className="sao-react__card"
                  data-value={card}
                  onClick={handleCardClick}>
                  {card}
                </button>
              ))}
            </section>
          </>
        )}

        <form
          className={formClassName}
          onSubmit={handleSubmit}>
          {features.addOns && (
            <button
              type="button"
              className="sao-react__square-button"
              aria-label="Add prompt">
              <Icon icon="plus" />
            </button>
          )}

          <input
            className="sao-react__query"
            placeholder={isConversationActive ? 'Ask a follow-up' : inputPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />

          <button
            type="button"
            className={`sao-react__ghost-button${isRecording ? ' sao-react__ghost-button--recording' : ''}`}
            aria-label={isRecording ? 'Stop recording' : 'Start recording'}
            title={
              canUseVoice
                ? isRecording
                  ? 'Stop recording'
                  : 'Start recording'
                : 'Speech recognition is not supported in this browser'
            }
            onClick={toggleRecording}
            aria-pressed={isRecording}
            disabled={!canUseVoice}>
            <Icon
              icon="microphone"
              size={'sm'}
              className={
                isRecording
                  ? 'sao-react__microphone-icon sao-react__microphone-icon--recording'
                  : 'sao-react__microphone-icon'
              }
            />
          </button>

          <button
            type="submit"
            className="sao-react__submit-button"
            disabled={!query.trim()}>
            Send
          </button>
        </form>
      </main>

      {features.sessionHistory && (
        <SessionDrawer
          isOpen={isDrawerOpen}
          onClose={closeDrawer}
        />
      )}
    </div>
  );
};
