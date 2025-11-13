export interface Links {
  id: string;
  user_id: string;
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
  other_url?: string | null;
}

/* Resume may come as:
   ↳ array of resumes
   ↳ single resume object
   ↳ or empty
*/
export interface Resume {
  id?: string;
  user_id?: string;
  resume_url?: string;
  extracted_text?: string;
  created_at?: string;
}

/* AI answer from backend */
export interface AIGeneratedAnswer {
  brief_summary?: string;
  detailed_answer?: string;
  bullet_points?: string[];
  suggested_followups?: string[];
}

/* History log: handle both JSON string and object */
export interface QuestionLog {
  id: string;
  hr_id: string;
  user_id: string;
  question: string;

  // Backend might return string or object
  answer: AIGeneratedAnswer | string;

  created_at: string;
}

/* User info */
export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;

  links?: Links;

  // Support ALL possible resume formats
  resume?: Resume | null;
  resumes?: Resume[] | Resume | null;

  questions_logs?: QuestionLog[];
}

/* Scraped data: all OPTIONAL, allow errors from backend */
export interface ScrapedData {
  linkedin?: {
    summary?: string;
    current_role?: string;
    skills?: string[];
    education?: string[];
    experience?: string[];
    recent_activity?: string[];
    error?: string;
  };

  github?: {
    bio?: string;
    top_repos?: {
      name?: string;
      description?: string;
      stars?: number;
      language?: string;
    }[];
    error?: string;
  };

  portfolio?: {
    projects?: {
      title?: string;
      description?: string;
    }[];
    error?: string;
  };
}
