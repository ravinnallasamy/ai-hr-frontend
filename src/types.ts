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

export interface QuestionLog {
  id: string;
  hr_id: string;
  user_id: string;
  question: string;
  answer: AIGeneratedAnswer; // Is a JSON object from backend
  created_at: string;
}

export interface UserProfile {
  id: string;
  user_id: string;
  full_name: string;
  email: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  created_at: string;
  links?: Links;
  resume?: Resume; // Single resume (legacy)
  resumes?: Resume[] | Resume; // Array of resumes OR single object (Supabase returns object for single relationship)
  questions_logs?: QuestionLog[];
}

export interface ScrapedData {
    linkedin?: { summary: string; current_role: string; skills: string[]; education: string[]; experience?: string[]; recent_activity?: string[] };
    github?: { bio: string; top_repos: { name: string; description: string; stars: number; language: string }[] };
    portfolio?: { projects: { title: string; description: string }[] };
}

export interface AIGeneratedAnswer {
  brief_summary: string;
  detailed_answer: string;
  bullet_points: string[];
  suggested_followups: string[];
}
