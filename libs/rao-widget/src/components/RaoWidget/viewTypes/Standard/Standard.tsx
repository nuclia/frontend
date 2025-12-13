import { useCallback, useEffect, useMemo, useRef, useState, type FC, type FormEvent, type MouseEvent } from 'react';
import { Icon } from '../../../Icon';
import { useRaoContext, useVoiceRecorder } from '../../../../hooks';
import { SessionDrawer } from '../../../SessionDrawer';
import { Conversation } from '../../../Conversation';
import type { IRaoWidget, IResources } from '../../RaoWidget.interface';
import { DEFAULT_RESOURCES } from '../../../../interfaces/const';

// @ts-expect-error - inline CSS imports are handled by the bundler
import styles from './Standard.css?inline';

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

export interface StandardProps extends IRaoWidget {
  onCloseFloating?: () => void;
}

export const Standard: FC<StandardProps> = ({
  promptconfig,
  recordingconfing,
  viewtype = 'conversation',
  onCloseFloating,
}) => {
  const { activeView, visibleViewType, onChat, setVisibleViewType, resources } = useRaoContext();
  const {
    hasSupport: canUseVoice,
    isRecording,
    stopRecording,
    toggleRecording,
    transcript,
  } = useVoiceRecorder(recordingconfing?.language ?? 'en-US');

  const [query, setQuery] = useState('');
  const [isDrawerOpen, setDrawerOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const drawerRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

  const isFloating = viewtype === 'floating';
  const isFloatingExpanded = isFloating && visibleViewType === 'conversation';
  const showAddOns = features.addOns && !isFloating;

  useEffect(() => {
    setIsExpanded(isFloatingExpanded);
  }, [isFloatingExpanded]);

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
    if (!promptconfig?.prompts || promptconfig.prompts.length === 0) {
      if (promptconfig?.usefallbackprompts) {
        return fallbackCards;
      }
      return [];
    }

    if (promptconfig.prompts.length < 4) {
      if (promptconfig.usefallbackprompts) {
        return [
          ...promptconfig.prompts,
          ...fallbackCards.slice(promptconfig.prompts.length, promptconfig.visibleprompts ?? 4),
        ];
      }
    }

    return promptconfig.prompts.slice(0, promptconfig.visibleprompts ?? 4);
  }, [promptconfig]);

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
    setQuery('');
    stopRecording();

    onChat(trimmed);
  };

  const isConversationActive = useMemo(() => activeView === 'conversation', [activeView]);

  const containerClassName = useMemo(() => {
    const classes = ['rao-react'];
    if (visibleViewType === 'floating') {
      classes.push('rao-react--floating');
      if (isExpanded) {
        classes.push('rao-react--floating-expanded');
      }
    }
    return classes.join(' ');
  }, [isFloating, isExpanded]);

  const formClassName = 'rao-react__form';

  const handleFloatingExpand = useCallback(() => {
    setVisibleViewType((prev) => (prev === 'conversation' ? 'floating' : 'conversation'));
  }, []);

  const handleCloseFloating = useCallback(() => {
    if (!onCloseFloating) {
      return;
    }
    stopRecording();
    onCloseFloating();
  }, [onCloseFloating, stopRecording]);

  return (
    <>
      <style>{styles}</style>
      <div className={containerClassName}>
        <header className="rao-react__header">
          <span className="rao-react__brand">{resources.intro_title}</span>

          <div className="rao-react__header-actions">
            {features.sessionHistory && (
              <button
                type="button"
                className="rao-react__icon-button"
                aria-label={resources.aria_openchat}
                aria-expanded={isDrawerOpen}
                onClick={openDrawer}
                ref={triggerRef}>
                <Icon
                  icon="submenu"
                  size={'sm'}
                />
              </button>
            )}

            {isFloating ? (
              <button
                type="button"
                className="rao-react__icon-button"
                aria-label={isExpanded ? resources.aria_collapsechat : resources.aria_expandchat}
                onClick={handleFloatingExpand}>
                <Icon
                  icon={isExpanded ? 'collapse' : 'expand'}
                  size={'sm'}
                />
              </button>
            ) : null}

            {onCloseFloating ? (
              <button
                type="button"
                className="rao-react__icon-button"
                aria-label={resources.aria_closechat}
                onClick={handleCloseFloating}>
                <span
                  aria-hidden="true"
                  className="rao-react__close-symbol">
                  &times;
                </span>
              </button>
            ) : null}
          </div>
        </header>

        <main className={`rao-react__main rao-react__main--${activeView}`}>
          {isConversationActive ? (
            <Conversation />
          ) : (
            <>
              <h1 className="rao-react__greeting">{resources.intro_greetings}</h1>

              {!!promptconfig?.prompts?.length && (
                <section
                  className="rao-react__cards"
                  aria-label={resources.aria_suggestedprompts}>
                  {displayCards.map((card, index) => (
                    <button
                      key={`${card}-${index}`}
                      type="button"
                      className="rao-react__card"
                      data-value={card}
                      onClick={handleCardClick}>
                      {card}
                    </button>
                  ))}
                </section>
              )}
            </>
          )}

          <form
            className={formClassName}
            onSubmit={handleSubmit}>
            {showAddOns && (
              <button
                type="button"
                className="rao-react__square-button"
                aria-label={resources.aria_addprompt}>
                <Icon icon="plus" />
              </button>
            )}

            <input
              className="rao-react__query"
              placeholder={
                isConversationActive ? resources.form_placeholder_followup : resources.form_placeholder_defuault
              }
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />

            {!!recordingconfing?.language && (
              <button
                type="button"
                className={`rao-react__ghost-button${isRecording ? ' rao-react__ghost-button--recording' : ''}`}
                aria-label={isRecording ? resources.aria_stoprecording : resources.aria_startrecording}
                title={
                  canUseVoice
                    ? isRecording
                      ? resources.aria_stoprecording
                      : resources.aria_startrecording
                    : resources.aria_notsupported
                }
                onClick={toggleRecording}
                aria-pressed={isRecording}
                disabled={!canUseVoice}>
                <Icon
                  icon="microphone"
                  size={'sm'}
                  className={
                    isRecording
                      ? 'rao-react__microphone-icon rao-react__microphone-icon--recording'
                      : 'rao-react__microphone-icon'
                  }
                />
              </button>
            )}
          </form>
        </main>

        {features.sessionHistory && (
          <SessionDrawer
            isOpen={isDrawerOpen}
            onClose={closeDrawer}
          />
        )}
      </div>
    </>
  );
};
