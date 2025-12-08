import { forwardRef, useId, useImperativeHandle, useRef } from 'react';
import { ISessionDrawer, RSessionDrawer } from './SessionDrawer.interface';
import { Icon } from '../Icon';
import { SessionHistory } from '../SessionHistory';

export const SessionDrawer = forwardRef<RSessionDrawer, ISessionDrawer>(({ isOpen, onClose }, ref) => {
  const drawerRef = useRef<HTMLDivElement | null>(null);

  const drawerHeadingId = useId();

  useImperativeHandle(ref, () => ({}));

  return (
    <aside
      ref={drawerRef}
      className={`rao-react__drawer ${isOpen ? 'rao-react__drawer--open' : ''}`}
      role="dialog"
      aria-modal="true"
      aria-labelledby={drawerHeadingId}
      tabIndex={-1}>
      <div className="rao-react__drawer-header">
        <div className="rao-react__drawer-title-wrapper">
          <h2
            id={drawerHeadingId}
            className="rao-react__drawer-title">
            Chat History
          </h2>
          <span className="rao-react__drawer-description">Review and jump back into recent conversations.</span>
        </div>
        <button
          type="button"
          className="rao-react__drawer-close"
          aria-label="Close chat history"
          onClick={onClose}>
          <Icon
            icon="chevrons-right"
            size="sm"
          />
        </button>
      </div>

      <button
        type="button"
        className="rao-react__drawer-new-chat">
        <Icon
          icon="plus"
          size="sm"
        />
        <span>New Chat</span>
      </button>

      <SessionHistory />
    </aside>
  );
});
