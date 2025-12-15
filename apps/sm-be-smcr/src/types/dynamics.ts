export type DynamicsList<T> = {
  value: T[];
  '@odata.nextLink'?: string;
  '@odata.count'?: number;
};

export type Contact = {
  contactid: string;
  fullname?: string;
  emailaddress1?: string;
};
