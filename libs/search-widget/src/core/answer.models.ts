export interface ChatEntry {
  question: string;
  answer: Answer;
}

export interface Answer {
  text: string;
  sources: { resourceId: string; paragraph: string }[]; // TEMPORARY
  incomplete?: boolean;
}
