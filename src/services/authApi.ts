import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const authClient = axios.create({
  baseURL: `${API_BASE_URL}/auth`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Attach JWT token from localStorage if present
authClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('smartbee_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at?: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: AuthUser;
}

/**
 * Register a new beekeeper account
 */
export async function registerUser(payload: RegisterPayload): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/register', payload);
  return response.data;
}

/**
 * Login with email and password
 */
export async function loginUser(payload: LoginPayload): Promise<AuthResponse> {
  const response = await authClient.post<AuthResponse>('/login', payload);
  return response.data;
}

/**
 * Fetch current authenticated user info
 */
export async function getCurrentUser(): Promise<{ success: boolean; user: AuthUser }> {
  const response = await authClient.get<{ success: boolean; user: AuthUser }>('/me');
  return response.data;
}
