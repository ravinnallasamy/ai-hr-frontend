/// <reference types="vite/client" />

import { UserProfile, ScrapedData, AIGeneratedAnswer } from '../types';

const BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

const getAuthHeader = () => {
    const token = localStorage.getItem('hr-auth-token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'An unknown error occurred' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return response.json();
};

export const apiService = {
    hrLogin: async (email: string, pass: string): Promise<{ accessToken: string }> => {
        const response = await fetch(`${BASE_URL}/api/hr/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password: pass }),
        });
        const data = await handleResponse(response);
        return { accessToken: data.accessToken };
    },

    getUsers: async (query: string, status: string): Promise<{ data: UserProfile[] }> => {
        const params = new URLSearchParams({ q: query, status });
        const response = await fetch(`${BASE_URL}/api/hr/users?${params.toString()}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    getUserById: async (userId: string): Promise<UserProfile> => {
        const response = await fetch(`${BASE_URL}/api/hr/user/${userId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },
    
    scrapeUserData: async (userId: string, type: 'linkedin' | 'github' | 'portfolio'): Promise<{data: ScrapedData}> => {
        const response = await fetch(`${BASE_URL}/api/scrape/${type}/${userId}`, {
            headers: getAuthHeader(),
        });
        return handleResponse(response);
    },

    askAiQuestion: async (userId: string, question: string): Promise<AIGeneratedAnswer> => {
        const response = await fetch(`${BASE_URL}/api/hr/ask-question`, {
            method: 'POST',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: userId, question }),
        });
        return handleResponse(response);
    },

    updateUserStatus: async (userId: string, status: 'Pending' | 'Approved' | 'Rejected'): Promise<UserProfile> => {
        const response = await fetch(`${BASE_URL}/api/hr/user/${userId}/status`, {
            method: 'PATCH',
            headers: { ...getAuthHeader(), 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        return handleResponse(response);
    }
};