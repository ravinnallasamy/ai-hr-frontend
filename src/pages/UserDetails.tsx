import React, { useState, useEffect, useCallback } from 'react';
import { UserProfile, ScrapedData, AIGeneratedAnswer, QuestionLog } from '../types';
import { apiService } from '../services/api';
import VoiceInput from '../components/VoiceInput';
import { ArrowLeftIcon, LinkedInIcon, GithubIcon, PortfolioIcon, LinkIcon, SendIcon } from '../components/icons';

interface UserDetailsProps {
  user: UserProfile;
  onBack: () => void;
}

const statusColorMap = {
  Pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  Approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  Rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
};

const UserDetails: React.FC<UserDetailsProps> = ({ user, onBack }) => {
    const [scrapedData, setScrapedData] = useState<ScrapedData | null>(null);
    const [isScraping, setIsScraping] = useState(false);
    const [question, setQuestion] = useState('');
    const [isAsking, setIsAsking] = useState(false);
    const [aiAnswer, setAiAnswer] = useState<AIGeneratedAnswer | null>(null);
    const [aiError, setAiError] = useState('');
    const [qAndAHistory, setQAndAHistory] = useState<QuestionLog[]>(user.questions_logs || []);
    const [currentStatus, setCurrentStatus] = useState<'Pending' | 'Approved' | 'Rejected'>(user.status);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

    const fetchScrapedData = useCallback(async (force = false) => {
        setIsScraping(true);
        try {
            console.log('🕷️ Starting to fetch scraped data for user:', user.user_id);
            
            // Fetch scraped data in parallel
            const [linkedinRes, githubRes, portfolioRes] = await Promise.allSettled([
                user.links?.linkedin_url ? apiService.scrapeUserData(user.user_id, 'linkedin') : Promise.resolve(null),
                user.links?.github_url ? apiService.scrapeUserData(user.user_id, 'github') : Promise.resolve(null),
                user.links?.portfolio_url ? apiService.scrapeUserData(user.user_id, 'portfolio') : Promise.resolve(null)
            ]);

            const scraped: ScrapedData = {};
            
            if (linkedinRes.status === 'fulfilled' && linkedinRes.value?.data) {
                scraped.linkedin = linkedinRes.value.data;
                console.log('✅ LinkedIn data fetched:', scraped.linkedin);
            } else if (linkedinRes.status === 'rejected') {
                console.error('❌ LinkedIn scraping failed:', linkedinRes.reason);
            }
            
            if (githubRes.status === 'fulfilled' && githubRes.value?.data) {
                scraped.github = githubRes.value.data;
                console.log('✅ GitHub data fetched:', scraped.github);
            } else if (githubRes.status === 'rejected') {
                console.error('❌ GitHub scraping failed:', githubRes.reason);
            }
            
            if (portfolioRes.status === 'fulfilled' && portfolioRes.value?.data) {
                scraped.portfolio = portfolioRes.value.data;
                console.log('✅ Portfolio data fetched:', scraped.portfolio);
            } else if (portfolioRes.status === 'rejected') {
                console.error('❌ Portfolio scraping failed:', portfolioRes.reason);
            }
            
            console.log('📊 Final scraped data to display:', scraped);
            setScrapedData(scraped);
        } catch (error) {
            console.error("❌ Scraping failed:", error);
        } finally {
            setIsScraping(false);
        }
    }, [user.user_id, user.links]);

    useEffect(() => {
        fetchScrapedData();
    }, [fetchScrapedData]);
    
    const handleAskQuestion = async (e?: React.FormEvent) => {
        if(e) e.preventDefault();
        // Handle all possible formats: array, object, or single resume
        let resume = null;
        if (Array.isArray(user.resumes) && user.resumes.length > 0) {
            resume = user.resumes[0];
        } else if (user.resumes && typeof user.resumes === 'object' && user.resumes.resume_url) {
            resume = user.resumes;
        } else if (user.resume) {
            resume = user.resume;
        }
        if (!question.trim() || !resume?.extracted_text) return;
        
        setIsAsking(true);
        setAiAnswer(null);
        setAiError('');

        try {
            const result = await apiService.askAiQuestion(user.user_id, question);
            setAiAnswer(result);
            // Simulate adding to history to avoid a full re-fetch
            const newLog: QuestionLog = {
                id: `q-${Date.now()}`,
                hr_id: 'hr-1',
                user_id: user.user_id,
                question: question,
                answer: result,
                created_at: new Date().toISOString()
            };
            setQAndAHistory(prev => [newLog, ...prev]);
            setQuestion('');
        } catch(error) {
            setAiError(error instanceof Error ? error.message : "An unknown error occurred.");
        } finally {
            setIsAsking(false);
        }
    };

    const handleStatusUpdate = async (newStatus: 'Pending' | 'Approved' | 'Rejected') => {
        if (isUpdatingStatus || currentStatus === newStatus) return;
        
        setIsUpdatingStatus(true);
        try {
            const updatedUser = await apiService.updateUserStatus(user.user_id, newStatus);
            // Update status from the response
            if (updatedUser && updatedUser.status) {
                setCurrentStatus(updatedUser.status);
            } else {
                setCurrentStatus(newStatus);
            }
        } catch (error) {
            console.error('Failed to update status:', error);
            alert(error instanceof Error ? error.message : 'Failed to update status');
        } finally {
            setIsUpdatingStatus(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
            <header className="bg-white dark:bg-gray-800 shadow-sm sticky top-0 z-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center">
                    <button onClick={onBack} className="mr-4 p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700">
                        <ArrowLeftIcon />
                    </button>
                    <div className="flex-grow">
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.full_name}</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${statusColorMap[currentStatus]}`}>{currentStatus}</span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleStatusUpdate('Approved')}
                                disabled={isUpdatingStatus || currentStatus === 'Approved'}
                                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                    currentStatus === 'Approved'
                                        ? 'bg-green-600 text-white cursor-default'
                                        : 'bg-green-500 text-white hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isUpdatingStatus && currentStatus !== 'Approved' ? 'Updating...' : 'Accept'}
                            </button>
                            <button
                                onClick={() => handleStatusUpdate('Rejected')}
                                disabled={isUpdatingStatus || currentStatus === 'Rejected'}
                                className={`px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                                    currentStatus === 'Rejected'
                                        ? 'bg-red-600 text-white cursor-default'
                                        : 'bg-red-500 text-white hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed'
                                }`}
                            >
                                {isUpdatingStatus && currentStatus !== 'Rejected' ? 'Updating...' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Ask AI Section */}
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Ask AI Interview Question</h2>
                        <form onSubmit={handleAskQuestion}>
                            <div className="flex items-center gap-3">
                                {(() => {
                                    // Handle all possible formats: array, object, or single resume
                                    let resume = null;
                                    if (Array.isArray(user.resumes) && user.resumes.length > 0) {
                                        resume = user.resumes[0];
                                    } else if (user.resumes && typeof user.resumes === 'object' && user.resumes.resume_url) {
                                        resume = user.resumes;
                                    } else if (user.resume) {
                                        resume = user.resume;
                                    }
                                    return (
                                <textarea
                                    value={question}
                                    onChange={(e) => setQuestion(e.target.value)}
                                            placeholder={resume ? `Ask about ${user.full_name.split(' ')[0]}'s experience...` : "Cannot ask question without a resume."}
                                    className="flex-grow block w-full p-3 border border-gray-300 rounded-md shadow-sm dark:bg-gray-700 dark:border-gray-600 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                                    rows={2}
                                            disabled={isAsking || !resume}
                                />
                                    );
                                })()}
                                <VoiceInput onTranscriptChange={setQuestion} isAsking={isAsking} />
                                {(() => {
                                    // Handle all possible formats: array, object, or single resume
                                    let resume = null;
                                    if (Array.isArray(user.resumes) && user.resumes.length > 0) {
                                        resume = user.resumes[0];
                                    } else if (user.resumes && typeof user.resumes === 'object' && user.resumes.resume_url) {
                                        resume = user.resumes;
                                    } else if (user.resume) {
                                        resume = user.resume;
                                    }
                                    return (
                                        <button type="submit" disabled={isAsking || !question.trim() || !resume} className="p-3 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed transition-colors">
                                    <SendIcon className="w-5 h-5"/>
                                </button>
                                    );
                                })()}
                            </div>
                        </form>
                        {isAsking && <div className="mt-4 flex items-center gap-2 text-gray-600 dark:text-gray-300"><div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>Generating answer...</div>}
                        {aiError && <p className="mt-4 text-red-500">{aiError}</p>}
                        {aiAnswer && (
                            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                <h3 className="font-semibold text-lg text-gray-900 dark:text-white">AI Generated Answer:</h3>
                                <p className="mt-2 text-sm italic text-gray-600 dark:text-gray-300">{aiAnswer.brief_summary}</p>
                                <p className="mt-4 text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{aiAnswer.detailed_answer}</p>
                                {aiAnswer.bullet_points.length > 0 && <ul className="mt-4 space-y-1 list-disc list-inside text-gray-800 dark:text-gray-200">
                                    {aiAnswer.bullet_points.map((pt, i) => <li key={i}>{pt}</li>)}
                                </ul>}
                                {aiAnswer.suggested_followups.length > 0 && <div className="mt-4">
                                    <h4 className="font-semibold text-gray-800 dark:text-gray-200">Suggested Follow-ups:</h4>
                                    <ul className="mt-2 space-y-1 list-disc list-inside text-sm text-gray-600 dark:text-gray-300">
                                        {aiAnswer.suggested_followups.map((f, i) => <li key={i}>{f}</li>)}
                                    </ul>
                                </div>}
                            </div>
                        )}
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Question & Answer History</h2>
                        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
                          {qAndAHistory.length > 0 ? qAndAHistory.map(log => {
                            // Handle both string (from DB) and object (from API) formats
                            const answer = typeof log.answer === 'string' ? JSON.parse(log.answer) : log.answer;
                            return (
                              <div key={log.id} className="p-4 border-l-4 border-blue-500 bg-gray-50 dark:bg-gray-700 rounded-r-lg">
                                <p className="font-semibold text-gray-800 dark:text-gray-200">{log.question}</p>
                                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 italic">{answer?.brief_summary}</p>
                                <p className="text-xs text-gray-400 mt-2">{new Date(log.created_at).toLocaleString()}</p>
                              </div>
                            );
                          }) : <p className="text-gray-500 dark:text-gray-400">No questions have been asked yet.</p>}
                        </div>
                    </div>

                    {(() => {
                        // Handle all possible formats: array, object, or single resume
                        let resume = null;
                        
                        if (Array.isArray(user.resumes) && user.resumes.length > 0) {
                            // Array format: [resume1, resume2, ...]
                            resume = user.resumes[0];
                        } else if (user.resumes && typeof user.resumes === 'object' && user.resumes.resume_url) {
                            // Object format: { id, user_id, resume_url, ... } (Supabase returns this for single relationship)
                            resume = user.resumes;
                        } else if (user.resume) {
                            // Legacy single resume format
                            resume = user.resume;
                        }
                        
                        return resume ? (
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden">
                            <h2 className="text-xl font-semibold p-6 text-gray-900 dark:text-white">Resume</h2>
                            <div className="w-full aspect-[8.5/11] border-t border-gray-200 dark:border-gray-700">
                                    <iframe 
                                        src={resume.resume_url} 
                                        className="w-full h-full" 
                                        title={`${user.full_name}'s resume`}
                                        onError={(e) => {
                                            console.error('Failed to load resume:', resume.resume_url);
                                            e.target.style.display = 'none';
                                        }}
                                    />
                            </div>
                        </div>
                    ) : (
                         <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Resume</h2>
                            <p className="mt-4 text-gray-500 dark:text-gray-400">This candidate has not uploaded a resume yet.</p>
                        </div>
                        );
                    })()}

                </div>

                {/* Right Column */}
                <div className="space-y-8">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Links</h2>
                        <div className="space-y-3">
                           {user.links?.linkedin_url ? <a href={user.links.linkedin_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline dark:text-blue-400"><LinkedInIcon/> LinkedIn Profile</a> : <p className="text-gray-500 text-sm">No LinkedIn profile provided.</p>}
                           {user.links?.github_url ? <a href={user.links.github_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline dark:text-blue-400"><GithubIcon/> GitHub Profile</a> : <p className="text-gray-500 text-sm">No GitHub profile provided.</p>}
                           {user.links?.portfolio_url ? <a href={user.links.portfolio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-blue-600 hover:underline dark:text-blue-400"><PortfolioIcon/> Portfolio Website</a> : <p className="text-gray-500 text-sm">No portfolio provided.</p>}
                        </div>
                    </div>
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Scraped Data</h2>
                        {isScraping ? <p className="text-sm text-gray-500">Loading scraped data...</p> : (
                            <div className="space-y-6 text-sm max-h-[600px] overflow-y-auto">
                                {/* LinkedIn Data */}
                                {scrapedData?.linkedin && !scrapedData.linkedin.error && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <LinkedInIcon className="w-5 h-5" /> LinkedIn Profile
                                        </h3>
                                        {scrapedData.linkedin.current_role && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Current Role: </span>
                                                <span className="text-gray-600 dark:text-gray-400">{scrapedData.linkedin.current_role}</span>
                                            </div>
                                        )}
                                        {scrapedData.linkedin.summary && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Summary: </span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{scrapedData.linkedin.summary}</p>
                                            </div>
                                        )}
                                        {scrapedData.linkedin.skills && scrapedData.linkedin.skills.length > 0 && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Skills: </span>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {scrapedData.linkedin.skills.map((skill, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                                                            {skill}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        {scrapedData.linkedin.education && scrapedData.linkedin.education.length > 0 && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Education: </span>
                                                <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                                                    {scrapedData.linkedin.education.map((edu, idx) => (
                                                        <li key={idx}>{edu}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                        {scrapedData.linkedin.experience && scrapedData.linkedin.experience.length > 0 && (
                                            <div className="mb-2">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Experience: </span>
                                                <ul className="list-disc list-inside mt-1 text-gray-600 dark:text-gray-400">
                                                    {scrapedData.linkedin.experience.map((exp, idx) => (
                                                        <li key={idx}>{exp}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* GitHub Data */}
                                {scrapedData?.github && !scrapedData.github.error && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <GithubIcon className="w-5 h-5" /> GitHub Profile
                                        </h3>
                                        {scrapedData.github.bio && (
                                            <div className="mb-3">
                                                <span className="font-semibold text-gray-700 dark:text-gray-300">Bio: </span>
                                                <p className="text-gray-600 dark:text-gray-400 mt-1">{scrapedData.github.bio}</p>
                                            </div>
                                        )}
                                        {scrapedData.github.top_repos && scrapedData.github.top_repos.length > 0 && (
                                            <div>
                                                <span className="font-semibold text-gray-700 dark:text-gray-300 mb-2 block">Top Repositories:</span>
                                                <div className="space-y-3 mt-2">
                                                    {scrapedData.github.top_repos.map((repo, idx) => (
                                                        <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                            <div className="flex items-start justify-between mb-1">
                                                                <span className="font-medium text-gray-800 dark:text-gray-200">{repo.name}</span>
                                                                {repo.stars > 0 && (
                                                                    <span className="text-xs text-gray-500 dark:text-gray-400">⭐ {repo.stars}</span>
                                                                )}
                                                            </div>
                                                            {repo.description && (
                                                                <p className="text-gray-600 dark:text-gray-400 text-xs mt-1">{repo.description}</p>
                                                            )}
                                                            {repo.language && (
                                                                <span className="inline-block mt-2 px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                                                                    {repo.language}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Portfolio Data */}
                                {scrapedData?.portfolio && !scrapedData.portfolio.error && (
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                                            <PortfolioIcon className="w-5 h-5" /> Portfolio Website
                                        </h3>
                                        {scrapedData.portfolio.projects && scrapedData.portfolio.projects.length > 0 && (
                                            <div className="space-y-3">
                                                {scrapedData.portfolio.projects.map((project, idx) => (
                                                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                                                        {project.title && (
                                                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-1">{project.title}</h4>
                                                        )}
                                                        {project.description && (
                                                            <p className="text-gray-600 dark:text-gray-400 text-xs">{project.description}</p>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* No Data Message */}
                                {(!scrapedData?.linkedin || scrapedData.linkedin.error) && 
                                 (!scrapedData?.github || scrapedData.github.error) && 
                                 (!scrapedData?.portfolio || scrapedData.portfolio.error) && (
                                    <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                                        No scraped data available for this user.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default UserDetails;
