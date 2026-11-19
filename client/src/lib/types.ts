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

export interface NotificationItem {
  id: number;
  type: string;
  content: string;
  isRead: boolean;
  createdAt: string;
}

export interface PointsSummary {
  trustPoints: number;
  completedJobs: number;
  level: string;
  entries: { id: number; points: number; reason: string; createdAt: string }[];
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

export interface DashboardData {
  platform: {
    total: number;
    users: number;
    OPEN: number;
    IN_PROGRESS: number;
    COMPLETED: number;
    CANCELLED: number;
  };
  mine: {
    posted: {
      total: number;
      OPEN: number;
      IN_PROGRESS: number;
      COMPLETED: number;
      CANCELLED: number;
    };
    applications: {
      total: number;
      PENDING: number;
      ACCEPTED: number;
      REJECTED: number;
      COMPLETED: number;
    };
    trustPoints: number;
    completedJobs: number;
  };
}

export interface MatchInfo {
  score: number;
  semantic: number;
  category: number;
  distance: number;
  distanceKm: number | null;
}

export interface MatchedJob extends Job {
  match: MatchInfo;
}

export interface MatchResponse {
  jobs: MatchedJob[];
  engine: "embedding" | "keyword" | "no-profile";
  modelStatus: "ready" | "loading" | "unavailable";
  hasProfile: boolean;
  usedLocation: boolean;
  weights: { semantic: number; category: number; distance: number };
}

export interface ChatJob {
  id: number;
  title: string;
  description: string;
  category: string | null;
  payMin: number;
  payMax: number;
  locationText: string | null;
  employer: string;
}

export interface ChatReply {
  reply: string;
  intent: string;
  entities: { categories: string[]; location: string | null };
  jobs: ChatJob[];
  action: { type: "create_job"; category: string | null } | null;
}
