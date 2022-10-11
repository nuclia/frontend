import { SvelteState } from '../state-lib';

interface ModalState {
  isViewerOpen: boolean;
  isPopupSearchOpen: boolean;
}

export const modalState = new SvelteState<ModalState>({
  isViewerOpen: false,
  isPopupSearchOpen: false,
});

export const isViewerOpen = modalState.writer<boolean>(
  (state) => state.isViewerOpen,
  (state, isOpen) => ({
    ...state,
    isViewerOpen: isOpen,
  }),
);

export const isPopupSearchOpen = modalState.writer<boolean>(
  (state) => state.isPopupSearchOpen,
  (state, isOpen) => ({
    ...state,
    isPopupSearchOpen: isOpen,
  }),
);

export const closeAll = modalState.writer<void>(
  () => null,
  () => ({
    isViewerOpen: false,
    isPopupSearchOpen: false,
  }),
);
