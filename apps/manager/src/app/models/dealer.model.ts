export class DealerPreferences {}

export class Dealer {
  id: string;
  data: DealerPreferences;
  users: string[];

  constructor(data: any) {
    this.id = data.id;
    this.data = data.data;
    this.users = data.users;
  }
}
