export interface User {
  id: number;
  username: string;
  email: string;
  phone: string | null;
  age: number | null;
  skills: string | null;
  profileImage: string | null;
  trustPoints: number;
  completedJobs: number;
  createdAt: string;
}

export interface Employer {
  id: number;
  username: string;
  profileImage: string | null;
  trustPoints: number;
}

export type JobStatus = "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
export type ApplicationStatus =
  | "PENDING"
  | "ACCEPTED"
  | "REJECTED"
  | "COMPLETED";

export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  category: string | null;
  payMin: number;
  payMax: number;
  locationText: string | null;
  latitude: number | null;
  longitude: number | null;
  ageMin: number | null;
  ageMax: number | null;
  status: JobStatus;
  createdAt: string;
  employer?: Employer;
  myApplication?: { id: number; status: ApplicationStatus } | null;
}

export type WorkResult = "PASS" | "FAIR" | "FAIL";

export interface MyJob extends Job {
  pendingApplicants: number;
}

export interface AppliedItem {
  id: number;
  status: ApplicationStatus;
  result: WorkResult | null;
  appliedAt: string;
  job: Job;
}

export interface Applicant {
  id: number;
  status: ApplicationStatus;
  result: WorkResult | null;
  appliedAt: string;
  user: {
    id: number;
    username: string;
    age: number | null;
    skills: string | null;
    profileImage: string | null;
    trustPoints: number;
    completedJobs: number;
  };
}
