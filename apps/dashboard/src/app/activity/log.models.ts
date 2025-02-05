export interface LogValueString {
  type: 'string';
  value: string;
}
export interface LogValueObject {
  type: 'object';
  value: any;
}

export class LogEntry {
  date: string;
  id: string;
  data: [string, LogValueString | LogValueObject][];

  constructor(dataStr: string) {
    try {
      const data = JSON.parse(dataStr);
      const { date, id, ...rest } = data;
      this.date = date;
      this.id = id;
      this.data = Object.entries(rest).map(([key, value]) => {
        if (typeof value === 'string') {
          return [key, { type: 'string', value }];
        }
        return [key, { type: 'object', value }];
      });
    } catch (e) {
      this.date = '';
      this.id = '';
      this.data = [];
    }
  }
}
