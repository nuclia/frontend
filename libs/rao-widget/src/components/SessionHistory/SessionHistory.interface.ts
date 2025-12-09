export interface ISessionHistory {}

export interface ISessionHistoryGroup {
  label: string;
  items: ISessionHistoryItem[];
}

export interface ISessionHistoryItem {
  id: string;
  title: string;
  description?: string;
  meta?: string;
}
