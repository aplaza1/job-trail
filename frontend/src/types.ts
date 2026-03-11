export type ApplicationStatus = "applied" | "interviewing" | "waiting" | "rejected" | "offer";
export type ApplicationMethod = "LinkedIn" | "Company Website" | "Referral" | "Indeed" | "Glassdoor" | "Recruiter" | "Other";

export interface Application {
  id: string;
  userId: string;
  company: string;
  title: string;
  status: ApplicationStatus;
  method: ApplicationMethod;
  dateApplied: string; // YYYY-MM-DD
  lastUpdated: string;
  link?: string;
  notes?: string;
}

export interface Interview {
  id: string;
  userId: string;
  company: string;
  title?: string;
  type: string;
  date: string; // YYYY-MM-DD
  time: string; // "HH:MM AM/PM" | "TBD"
  tentative: boolean;
  notes?: string;
  applicationId?: string;
}

export interface Profile {
  userId: string;
  displayName?: string;
  isPublic: boolean;
  shareToken: string;
}

export interface PublicDashboard {
  displayName?: string;
  applications: Application[];
  interviews: Interview[];
}
