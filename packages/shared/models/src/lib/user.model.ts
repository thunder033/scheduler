export enum UserRole {
  Coordinator = 'coordinator',
  Member = 'member',
  Prospect = 'prospect',
}

export enum ContactMethod {
  Phone = 'phone',
  Signal = 'signal',
  WhatsApp = 'whatsapp',
}

export interface Contact {
  method: ContactMethod;
  value: string;
}

export interface User {
  id: string;
  displayName: string;
  contact: Contact[];
  roles: UserRole[];
}
