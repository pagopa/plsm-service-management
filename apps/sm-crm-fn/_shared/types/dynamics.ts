export interface DynamicsList<T> {
  value: T[];
  "@odata.nextLink"?: string;
  "@odata.count"?: number;
}

export interface Contact {
  contactid: string;
  fullname?: string;
  emailaddress1?: string;
  firstname?: string;
  lastname?: string;
  telephone1?: string;
}

export interface Appointment {
  activityid: string;
  subject?: string;
  scheduledstart?: string;
  scheduledend?: string;
  location?: string;
  description?: string;
  statecode?: number;
  statuscode?: number;
}

export interface CreateAppointmentRequest {
  subject: string;
  scheduledstart: string;
  scheduledend: string;
  location?: string;
  description?: string;
  "regardingobjectid_contact@odata.bind"?: string;
}

export interface DynamicsError {
  error: {
    code: string;
    message: string;
    innererror?: {
      message: string;
      type: string;
      stacktrace: string;
    };
  };
}