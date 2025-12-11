export type EViewType = 'conversation' | 'floating';

export interface IRaoWidget {
  title?: string;
  username?: string;
  cards?: string[];
  inputplaceholder?: string;

  viewtype?: EViewType;
  onFloatingOpen?: () => void;
  onFloatingClose?: () => void;
}
