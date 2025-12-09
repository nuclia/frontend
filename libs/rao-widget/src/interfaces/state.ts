interface IState<T> {
  data: T | null;
  status: 'idle' | 'loading' | 'success' | 'error';
}

export interface ICallState<T> {
  [key: string]: IState<T>;
}
