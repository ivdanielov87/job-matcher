export interface Job {
  title: string;
  company: string;
  url: string;
  date_posted: string;
  location: string;
  employment_type: string;
  description: string;
  score: number;
  matched_skills: string[];
  missing_skills: string[];
  experience_match: boolean;
  summary: string;
}

export interface AnalyzeResponse {
  success: boolean;
  jobs: Job[];
  total: number;
  processed_at: string;
  message?: string;
  error?: string;
}

export interface FormData {
  location: string;
  language: string;
  days_back: number;
  email: string;
}
