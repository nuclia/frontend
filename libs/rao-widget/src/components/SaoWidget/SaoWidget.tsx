import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type FC,
  type FormEvent,
  type MouseEvent,
} from 'react';
import { Icon } from '../Icon';
import { SessionHistory } from '../SessionHistory';
import { useSaoContext } from '../../hooks';
import { ISaoWidget } from './SaoWidget.interface';

const fallbackCards = [
  'Prompt Placeholder',
  'Prompt Placeholder',
  'Recent Chat Placeholder',
  'Recent Chat Placeholder',
];

export const SaoWidget: FC<ISaoWidget> = ({ title, userName, cards, inputPlaceholder }) => {
  const context = useSaoContext();

  const [query, setQuery] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const drawerHeadingId = useId();

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
  };

  return (
    <div className="sao-react">
      <header className="sao-react__header">
        <span className="sao-react__brand">{title}</span>
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
      </header>

      <main className="sao-react__main">
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

        <form
          className="sao-react__form"
          onSubmit={handleSubmit}>
          <button
            type="button"
            className="sao-react__square-button"
            aria-label="Add prompt">
            <Icon icon="plus" />
          </button>
          <input
            className="sao-react__query"
            placeholder={inputPlaceholder}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button
            type="button"
            className="sao-react__ghost-button"
            aria-label="Toggle microphone"
            title="Toggle microphone">
            <Icon
              icon="microphone"
              size={'sm'}
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

      <aside
        ref={drawerRef}
        className={`sao-react__drawer ${isDrawerOpen ? 'sao-react__drawer--open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerHeadingId}
        tabIndex={-1}>
        <div className="sao-react__drawer-header">
          <div className="sao-react__drawer-title-wrapper">
            <h2
              id={drawerHeadingId}
              className="sao-react__drawer-title">
              Chat History
            </h2>
            <span className="sao-react__drawer-description">Review and jump back into recent conversations.</span>
          </div>
          <button
            type="button"
            className="sao-react__drawer-close"
            aria-label="Close chat history"
            onClick={closeDrawer}>
            <Icon
              icon="chevrons-right"
              size="sm"
            />
          </button>
        </div>

        <button
          type="button"
          className="sao-react__drawer-new-chat">
          <Icon
            icon="plus"
            size="sm"
          />
          <span>New Chat</span>
        </button>

        <SessionHistory />
      </aside>
    </div>
  );
};
