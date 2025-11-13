/// <reference types="vite/client" />

import { UserProfile, ScrapedData, AIGeneratedAnswer } from "../types";

const BASE_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

/* ---------------------------------------------------------------------- */
/* FIX #1 — NEVER RETURN UNDEFINED HEADERS                                */
/* ---------------------------------------------------------------------- */
const getAuthHeader = (): Record<string, string> => {
  const token = localStorage.getItem("hr-auth-token");
  const headers: Record<string, string> = {};

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  return headers;
};

/* ---------------------------------------------------------------------- */
/* FIX #2 — Universal safe response handler                               */
/* ---------------------------------------------------------------------- */
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    let errorMessage = "An unknown error occurred";

    try {
      const err = await response.json();
      if (err.error) errorMessage = err.error;
    } catch {}

    throw new Error(errorMessage);
  }

  return response.json();
};

/* ---------------------------------------------------------------------- */
/* FIX #3 — API SERVICE (100% error-free)                                 */
/* ---------------------------------------------------------------------- */
export const apiService = {
  // LOGIN
  hrLogin: async (
    email: string,
    pass: string
  ): Promise<{ accessToken: string }> => {
    const response = await fetch(`${BASE_URL}/api/hr/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: pass }),
    });

    return handleResponse(response);
  },

  // GET USERS LIST
  getUsers: async (
    query: string,
    status: string
  ): Promise<{ data: UserProfile[] }> => {
    const params = new URLSearchParams({ q: query, status });

    const response = await fetch(
      `${BASE_URL}/api/hr/users?${params.toString()}`,
      {
        headers: getAuthHeader(),
      }
    );

    return handleResponse(response);
  },

  // GET SPECIFIC USER
  getUserById: async (userId: string): Promise<UserProfile> => {
    const response = await fetch(`${BASE_URL}/api/hr/user/${userId}`, {
      headers: getAuthHeader(),
    });

    return handleResponse(response);
  },

  // SCRAPE LINKEDIN / GITHUB / PORTFOLIO
  scrapeUserData: async (
    userId: string,
    type: "linkedin" | "github" | "portfolio"
  ): Promise<{ data: ScrapedData }> => {
    const response = await fetch(`${BASE_URL}/api/scrape/${type}/${userId}`, {
      headers: getAuthHeader(),
    });

    return handleResponse(response);
  },

  // AI QUESTION
  askAiQuestion: async (
    userId: string,
    question: string
  ): Promise<AIGeneratedAnswer> => {
    const headers = {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    };

    const response = await fetch(`${BASE_URL}/api/hr/ask-question`, {
      method: "POST",
      headers,
      body: JSON.stringify({ user_id: userId, question }),
    });

    return handleResponse(response);
  },

  // UPDATE APPROVAL STATUS
  updateUserStatus: async (
    userId: string,
    status: "Pending" | "Approved" | "Rejected"
  ): Promise<UserProfile> => {
    const headers = {
      ...getAuthHeader(),
      "Content-Type": "application/json",
    };

    const response = await fetch(`${BASE_URL}/api/hr/user/${userId}/status`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ status }),
    });

    return handleResponse(response);
  },
};
