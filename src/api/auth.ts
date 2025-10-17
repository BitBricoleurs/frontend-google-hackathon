import { api } from "@/lib/api-client";
import type { LoginRequest, LoginResponse, ResponderProfile } from "@/types/auth";

// MOCK DATA - Remove when backend is ready
const MOCK_RESPONDERS: Record<string, { password: string; profile: ResponderProfile }> = {
  "RESP001": {
    password: "password123",
    profile: {
      id: "1",
      responderId: "RESP001",
      name: "Jean Dupont",
      role: "responder",
      department: "Emergency Services",
      shift: "Morning",
    },
  },
  "RESP002": {
    password: "password123",
    profile: {
      id: "2",
      responderId: "RESP002",
      name: "Marie Martin",
      role: "supervisor",
      department: "Emergency Services",
      shift: "Evening",
    },
  },
  "ADMIN001": {
    password: "admin123",
    profile: {
      id: "3",
      responderId: "ADMIN001",
      name: "Pierre Bernard",
      role: "admin",
      department: "Administration",
    },
  },
};

/**
 * Authenticate a responder with their ID and password
 * @param credentials - Responder ID and password
 * @returns Login response with tokens and responder profile
 */
export async function login(credentials: LoginRequest): Promise<LoginResponse> {
  // MOCK IMPLEMENTATION - Replace with actual API call when backend is ready
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const mockResponder = MOCK_RESPONDERS[credentials.responderId];

      if (!mockResponder || mockResponder.password !== credentials.password) {
        reject(new Error("Invalid responder ID or password"));
        return;
      }

      // Simulate successful login
      const mockResponse: LoginResponse = {
        access_token: `mock_access_token_${Date.now()}`,
        refresh_token: `mock_refresh_token_${Date.now()}`,
        responder: mockResponder.profile,
      };

      resolve(mockResponse);
    }, 800); // Simulate network delay
  });

  // TODO: Uncomment when backend is ready
  // const response = await api.post<LoginResponse>("/auth/login", credentials);
  // return response.data;
}

/**
 * Logout the current responder
 */
export async function logout(): Promise<void> {
  // MOCK IMPLEMENTATION - Replace with actual API call when backend is ready
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve();
    }, 300);
  });

  // TODO: Uncomment when backend is ready
  // await api.post("/auth/logout");
}

/**
 * Get current responder profile
 * @returns Current authenticated responder profile
 */
export async function getCurrentResponder(): Promise<ResponderProfile> {
  // MOCK IMPLEMENTATION - Replace with actual API call when backend is ready
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // In a real scenario, this would validate the token and return the user
      const mockProfile = MOCK_RESPONDERS["RESP001"].profile;
      resolve(mockProfile);
    }, 500);
  });

  // TODO: Uncomment when backend is ready
  // const response = await api.get<ResponderProfile>("/auth/me");
  // return response.data;
}

/**
 * Verify if a token is still valid
 * @returns Boolean indicating if token is valid
 */
export async function verifyToken(): Promise<boolean> {
  try {
    // MOCK IMPLEMENTATION - Replace with actual API call when backend is ready
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, 200);
    });

    // TODO: Uncomment when backend is ready
    // await api.get("/auth/verify");
    // return true;
  } catch {
    return false;
  }
}
