export type JobSource = 'dev.bg' | 'jobs.bg';

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
  main_stack?: string[];
  main_alt?: string;
  summary: string;
  source?: JobSource;
}

export interface MarketGap {
  skill: string;
  jobs_count: number;
  best_score: number;
}

export interface CVReview {
  market_gaps?: MarketGap[];
  tips?: string[];
}

export interface AnalyzeResponse {
  success: boolean;
  jobs: Job[];
  total: number;
  processed_at: string;
  processing_time_ms?: number;
  cv_review?: CVReview;
  message?: string;
  error?: string;
}

export interface FormData {
  location: string;
  days_back: number;
  email: string;
}
