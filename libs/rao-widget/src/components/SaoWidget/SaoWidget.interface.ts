export interface ISaoWidget {
  title: string;
  userName: string;
  cards: string[];
  inputPlaceholder: string;

  viewType?: 'conversation' | 'floating';
}
