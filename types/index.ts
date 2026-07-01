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

export interface TechDemand {
  tech: string;
  count: number;
}

export interface SearchStats {
  total_listings: number;   // all remote listings in the category(ies) on dev.bg
  in_period: number;        // listings within the selected days_back window
  from_core_stack?: number; // in-period listings sharing >=1 of the candidate's languages/frameworks
  evaluated: number;        // jobs that passed the keyword pre-filter and got scored
  matched: number;         // jobs shown (score >= adaptive threshold)
  below_threshold: number; // in_period jobs that did not reach the threshold
  below_30: number;        // evaluated jobs scoring below 30%
  threshold: number;       // the show-threshold actually applied (30 or 40)
  role: string;            // candidate job_type, e.g. "QA"
  categories: string[];    // dev.bg sections searched, primary first
  period_days: number;     // days_back window
  location?: string;       // user's location choice, e.g. "Remote" / "Пловдив"
  stack_core?: string[];   // candidate languages + frameworks (what "in your stack" matches on)
  stack_tools?: string[];  // candidate tools
  tech_demand?: TechDemand[]; // most-requested technologies across the in-period listings
  found?: number;          // legacy alias of in_period
}

export interface AnalyzeResponse {
  success: boolean;
  jobs: Job[];
  total: number;
  processed_at: string;
  processing_time_ms?: number;
  cv_review?: CVReview;
  stats?: SearchStats;
  message?: string;
  error?: string;
}

export interface FormData {
  location: string;
  days_back: number;
  email: string;
}
