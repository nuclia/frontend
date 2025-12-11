import { useCallback, useEffect, useState, type FC } from 'react';
import { Icon } from '../../../Icon';
import { Standard } from '../Standard/Standard';
import type { IRaoWidget } from '../../RaoWidget.interface';

import './Floating.css';

export interface FloatingProps extends IRaoWidget {}

export const Floating: FC<FloatingProps> = ({
  onFloatingOpen,
  onFloatingClose,
  viewtype: _ignoredViewType,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const openWidget = useCallback(() => {
    if (isOpen) {
      return;
    }
    setIsOpen(true);
    onFloatingOpen?.();
  }, [isOpen, onFloatingOpen]);

  const closeWidget = useCallback(() => {
    if (!isOpen) {
      return;
    }
    setIsOpen(false);
    onFloatingClose?.();
  }, [isOpen, onFloatingClose]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeWidget();
      }
    };

    document.addEventListener('keydown', handleKeydown);

    return () => {
      document.removeEventListener('keydown', handleKeydown);
    };
  }, [isOpen, closeWidget]);

  return (
    <div className="rao-floating">
      {!isOpen ? (
        <button
          type="button"
          className="rao-floating__launcher"
          aria-haspopup="dialog"
          aria-expanded={false}
          aria-label="Open chat"
          onClick={openWidget}>
          <Icon
            icon="chat"
            size={'md'}
            className="rao-floating__launcher-icon"
          />
        </button>
      ) : null}

      {isOpen ? (
        <div
          className="rao-floating__panel"
          role="dialog"
          aria-modal="false">
          <Standard
            {...props}
            viewtype="floating"
            onCloseFloating={closeWidget}
          />
        </div>
      ) : null}
    </div>
  );
};
