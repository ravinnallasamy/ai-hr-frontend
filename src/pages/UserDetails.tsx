import { useState, useEffect, useCallback } from 'react';
import {
  UserProfile,
  AIGeneratedAnswer,
  QuestionLog,
  Resume,
} from '../types';   // ✅ Removed ScrapedData import
import { apiService } from '../services/api';
import VoiceInput from '../components/VoiceInput';
import {
  ArrowLeftIcon,
  LinkedInIcon,
  GithubIcon,
  PortfolioIcon,
  SendIcon,
} from '../components/icons';

// -----------------------------------------------------------------------------------
// SAFE TYPES (to avoid TS2559 errors)
// -----------------------------------------------------------------------------------

type SafeLinkedIn = {
  summary?: string;
  current_role?: string;
  skills?: string[];
  education?: string[];
  experience?: string[];
  recent_activity?: string[];
  error?: string;
};

type SafeGithub = {
  bio?: string;
  top_repos?: {
    name?: string;
    description?: string;
    stars?: number;
    language?: string;
  }[];
  error?: string;
};

type SafePortfolio = {
  projects?: {
    title?: string;
    description?: string;
  }[];
  error?: string;
};

interface SafeScraped {
  linkedin?: SafeLinkedIn;
  github?: SafeGithub;
  portfolio?: SafePortfolio;
}

// -----------------------------------------------------------------------------------

interface UserDetailsProps {
  user: UserProfile;
  onBack: () => void;
}

const statusColorMap = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

// SAFE resume resolver
const resolveResume = (user: UserProfile): Resume | null => {
  if (Array.isArray(user.resumes) && user.resumes.length > 0) return user.resumes[0];
  if (user.resumes && typeof user.resumes === 'object' && 'resume_url' in user.resumes)
    return user.resumes;
  if (user.resume) return user.resume;
  return null;
};

export default function UserDetails({ user, onBack }: UserDetailsProps) {
  const [scrapedData, setScrapedData] = useState<SafeScraped | null>(null);
  const [isScraping, setIsScraping] = useState(false);

  const [question, setQuestion] = useState('');
  const [isAsking, setIsAsking] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<AIGeneratedAnswer | null>(null);
  const [aiError, setAiError] = useState('');

  const [qAndAHistory, setQAndAHistory] = useState<QuestionLog[]>(user.questions_logs || []);
  const [currentStatus, setCurrentStatus] = useState<
    'Pending' | 'Approved' | 'Rejected'
  >(user.status);

  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // -----------------------------------------------------------------------------------
  // FETCH SCRAPED DATA (SAFE VERSION)
  // -----------------------------------------------------------------------------------

  const fetchScrapedData = useCallback(async () => {
    setIsScraping(true);

    try {
      const [linkedinRes, githubRes, portfolioRes] = await Promise.allSettled<any>([
        user.links?.linkedin_url
          ? apiService.scrapeUserData(user.user_id, 'linkedin')
          : Promise.resolve(null),
        user.links?.github_url
          ? apiService.scrapeUserData(user.user_id, 'github')
          : Promise.resolve(null),
        user.links?.portfolio_url
          ? apiService.scrapeUserData(user.user_id, 'portfolio')
          : Promise.resolve(null),
      ]);

      const safe: SafeScraped = {};

      if (linkedinRes.status === 'fulfilled' && linkedinRes.value?.data)
        safe.linkedin = linkedinRes.value.data;

      if (githubRes.status === 'fulfilled' && githubRes.value?.data)
        safe.github = githubRes.value.data;

      if (portfolioRes.status === 'fulfilled' && portfolioRes.value?.data)
        safe.portfolio = portfolioRes.value.data;

      setScrapedData(safe);
    } catch (err) {
      console.error('Scraping failed:', err);
    } finally {
      setIsScraping(false);
    }
  }, [user.user_id, user.links]);

  useEffect(() => {
    fetchScrapedData();
  }, [fetchScrapedData]);

  // -----------------------------------------------------------------------------------
  // ASK AI QUESTION
  // -----------------------------------------------------------------------------------

  const handleAskQuestion = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    const resume = resolveResume(user);
    if (!resume || !resume.extracted_text || !question.trim()) return;

    setIsAsking(true);
    setAiAnswer(null);
    setAiError('');

    try {
      const result = await apiService.askAiQuestion(user.user_id, question);
      setAiAnswer(result);

      const newLog: QuestionLog = {
        id: `q-${Date.now()}`,
        hr_id: 'hr-1',
        user_id: user.user_id,
        question,
        answer: result,
        created_at: new Date().toISOString(),
      };

      setQAndAHistory((prev) => [newLog, ...prev]);
      setQuestion('');
    } catch (err) {
      setAiError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setIsAsking(false);
    }
  };

  // -----------------------------------------------------------------------------------
  // STATUS UPDATE
  // -----------------------------------------------------------------------------------

  const handleStatusUpdate = async (newStatus: 'Pending' | 'Approved' | 'Rejected') => {
    if (isUpdatingStatus || currentStatus === newStatus) return;

    setIsUpdatingStatus(true);

    try {
      const updatedUser = await apiService.updateUserStatus(user.user_id, newStatus);
      setCurrentStatus(updatedUser.status || newStatus);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Failed to update');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const resume = resolveResume(user);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      
      {/* HEADER */}
      <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center">
          <button onClick={onBack} className="mr-4 p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full">
            <ArrowLeftIcon />
          </button>

          <div className="flex-grow">
            <h1 className="text-2xl font-bold">{user.full_name}</h1>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>

          <span className={`px-3 py-1 rounded-full text-sm font-medium ${statusColorMap[currentStatus]}`}>
            {currentStatus}
          </span>
        </div>
      </header>

      {/* MAIN GRID */}
      <main className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8 px-4 py-8">

        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 space-y-8">

          {/* ASK AI */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Ask AI Interview Question</h2>

            <form onSubmit={handleAskQuestion} className="flex gap-3 mt-4">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                disabled={!resume || isAsking}
                placeholder={
                  resume
                    ? `Ask about ${user.full_name.split(' ')[0]}'s experience...`
                    : 'Cannot ask question without a resume.'
                }
                className="flex-grow border p-3 rounded dark:bg-gray-700"
              />

              <VoiceInput onTranscriptChange={setQuestion} isAsking={isAsking} />

              <button
                type="submit"
                disabled={!question.trim() || !resume || isAsking}
                className="bg-blue-600 text-white p-3 rounded-full disabled:bg-blue-300"
              >
                <SendIcon />
              </button>
            </form>

            {isAsking && <p className="mt-3 text-gray-500">Generating answer...</p>}
            {aiError && <p className="mt-3 text-red-500">{aiError}</p>}

            {aiAnswer && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded">
                <h3 className="font-semibold">AI Answer</h3>

                <p className="italic mt-2">{aiAnswer.brief_summary}</p>
                <p className="mt-2 whitespace-pre-wrap">{aiAnswer.detailed_answer}</p>

                {aiAnswer.bullet_points?.length > 0 && (
                  <ul className="list-disc list-inside mt-2">
                    {aiAnswer.bullet_points.map((p, i) => (
                      <li key={i}>{p}</li>
                    ))}
                  </ul>
                )}

                {aiAnswer.suggested_followups?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-semibold">Suggested Follow-ups</h4>
                    <ul className="list-disc list-inside mt-2">
                      {aiAnswer.suggested_followups.map((s, i) => (
                        <li key={i}>{s}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Q&A HISTORY */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold">Question History</h2>

            <div className="mt-4 space-y-3 max-h-96 overflow-y-auto">
              {qAndAHistory.length > 0 ? (
                qAndAHistory.map((log) => {
                  const answer =
                    typeof log.answer === 'string'
                      ? JSON.parse(log.answer)
                      : log.answer;

                  return (
                    <div
                      key={log.id}
                      className="p-4 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 rounded"
                    >
                      <p className="font-semibold">{log.question}</p>
                      <p className="italic text-sm mt-1">{answer?.brief_summary}</p>
                      <p className="text-xs text-gray-400">{new Date(log.created_at).toLocaleString()}</p>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500">No questions yet.</p>
              )}
            </div>
          </div>

          {/* RESUME VIEWER */}
          <div className="bg-white dark:bg-gray-800 rounded shadow overflow-hidden">
            <h2 className="text-xl font-semibold p-6">Resume</h2>

            {resume ? (
              <iframe
                src={resume.resume_url}
                className="w-full h-[700px]"
                title="Resume"
              />
            ) : (
              <p className="p-6 text-gray-500">This candidate has no resume.</p>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-8">

          {/* LINKS */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Links</h2>

            <div className="space-y-3">
              {user.links?.linkedin_url ? (
                <a href={user.links.linkedin_url} target="_blank" className="flex items-center gap-2 text-blue-600">
                  <LinkedInIcon /> LinkedIn
                </a>
              ) : (
                <p className="text-gray-500">No LinkedIn</p>
              )}

              {user.links?.github_url ? (
                <a href={user.links.github_url} target="_blank" className="flex items-center gap-2 text-blue-600">
                  <GithubIcon /> GitHub
                </a>
              ) : (
                <p className="text-gray-500">No GitHub</p>
              )}

              {user.links?.portfolio_url ? (
                <a href={user.links.portfolio_url} target="_blank" className="flex items-center gap-2 text-blue-600">
                  <PortfolioIcon /> Portfolio
                </a>
              ) : (
                <p className="text-gray-500">No portfolio</p>
              )}
            </div>
          </div>

          {/* SCRAPED DATA */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded shadow">
            <h2 className="text-xl font-semibold mb-4">Scraped Data</h2>

            {isScraping && <p className="text-gray-500">Loading...</p>}

            {!isScraping && scrapedData && (
              <div className="space-y-6 max-h-[600px] overflow-y-auto">
                
                {/* LinkedIn */}
                {scrapedData.linkedin && (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <LinkedInIcon /> LinkedIn
                    </h3>

                    {scrapedData.linkedin.summary && (
                      <p className="mt-2">{scrapedData.linkedin.summary}</p>
                    )}
                  </div>
                )}

                {/* GitHub */}
                {scrapedData.github && (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <GithubIcon /> GitHub
                    </h3>
                    {scrapedData.github.bio && <p className="mt-2">{scrapedData.github.bio}</p>}
                  </div>
                )}

                {/* Portfolio */}
                {scrapedData.portfolio && scrapedData.portfolio.projects?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <PortfolioIcon /> Portfolio
                    </h3>

                    {scrapedData.portfolio.projects.map((proj, i) => (
                      <div key={i} className="mt-2">
                        <p className="font-semibold">{proj.title}</p>
                        <p>{proj.description}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* No Data */}
                {!scrapedData.linkedin &&
                  !scrapedData.github &&
                  !scrapedData.portfolio && (
                    <p className="text-gray-400 text-center">No scraped data available.</p>
                  )}
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
