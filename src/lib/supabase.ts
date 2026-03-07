import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabaseUrl = `https://${projectId}.supabase.co`;

export const supabase = createClient(supabaseUrl, publicAnonKey);

// Auth helpers
export const auth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    // Store access token
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;

    // Clear local storage
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
  },

  async getSession() {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;

    // Update access token if we have a session
    if (data.session?.access_token) {
      localStorage.setItem('access_token', data.session.access_token);
      localStorage.setItem('user', JSON.stringify(data.session.user));
    }

    return data.session;
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem('access_token');
  },
};
