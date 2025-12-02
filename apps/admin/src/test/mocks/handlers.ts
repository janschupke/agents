import { http, HttpResponse } from 'msw';

// Use full URL for MSW - it matches against the complete request URL
const API_BASE = 'http://localhost:3001';

// Mock data
export const mockUsers = [
  {
    id: 'user_1',
    email: 'admin@example.com',
    firstName: 'Admin',
    lastName: 'User',
    imageUrl: null,
    roles: ['admin'],
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'user_2',
    email: 'user@example.com',
    firstName: 'Regular',
    lastName: 'User',
    imageUrl: null,
    roles: ['user'],
    createdAt: '2024-01-02T00:00:00.000Z',
  },
];

export const mockSystemRules = {
  rules: ['Rule 1', 'Rule 2'],
};

export const handlers = [
  // Get current user
  http.get(`${API_BASE}/api/user/me`, () => {
    return HttpResponse.json(mockUsers[0]);
  }),

  // Get all users
  http.get(`${API_BASE}/api/user/all`, () => {
    return HttpResponse.json(mockUsers);
  }),

  // Get system behavior rules
  http.get(`${API_BASE}/api/system-config/behavior-rules`, () => {
    return HttpResponse.json(mockSystemRules);
  }),

  // Update system behavior rules
  http.put(
    `${API_BASE}/api/system-config/behavior-rules`,
    async ({ request }) => {
      const body = await request.json();
      return HttpResponse.json({ rules: (body as { rules: string[] }).rules });
    }
  ),
];
