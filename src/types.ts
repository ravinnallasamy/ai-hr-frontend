export interface Links {
  id: string;
  user_id: string;
  linkedin_url: string;
  github_url: string;
  portfolio_url: string;
  other_url: string;
}

export interface Resume {
  id: string;
  user_id: string;
  resume_url: string;
  extracted_text: string;
  created_at: string;
}

export interface AIGeneratedAnswer {
  brief_summary: string;
  detailed_answer: string;
  bullet_points?: string[];
  suggested_followups?: string[];
}

export interface QuestionLog {
  id: string;
  hr_id: string;
  user_id: string;
  question: string;
  answer: AIGeneratedAnswer | string; 
  created_at: string;
}

/* ------------------------------------------------------------------------------------------------
   SCRAPED DATA — MATCHES EXACT BACKEND RESPONSE WITH OPTIONAL 'error'
-------------------------------------------------------------------------------------------------- */

export interface LinkedInData {
  summary?: string;
  current_role?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
  recent_activity?: string[];
  error?: string;
}

export interface GithubRepo {
  name: string;
  description: string;
  stars: number;
  language: string;
}

export interface GithubData {
  bio?: string;
  top_repos?: GithubRepo[];
  error?: string;
}

export interface PortfolioProject {
  title: string;
  description: string;
}

export interface PortfolioData {
  projects?: PortfolioProject[];
  error?: string;
}

export interface ScrapedData {
  linkedin?: LinkedInData;
  github?: GithubData;
  portfolio?: PortfolioData;
}

/* ------------------------------------------------------------------------------------------------ */

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: "Pending" | "Approved" | "Rejected";
  created_at: string;

  links?: Links;

  resume?: Resume;              
  resumes?: Resume[] | Resume; 

  questions_logs?: QuestionLog[];
}
