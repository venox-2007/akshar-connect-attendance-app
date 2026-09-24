import { User } from '../types';
import { DEMO_ADMIN, INITIAL_TEACHERS } from '../data/mockDatabase';

const SESSION_KEY = 'akshar_connect_session_v1';

// Preset credentials for demo
const DEMO_CREDENTIALS: Record<string, { password: string; user: User }> = {
  'admin@aksharconnect.demo': {
    password: 'admin123',
    user: DEMO_ADMIN
  },
  'riya@aksharconnect.demo': {
    password: 'teacher123',
    user: {
      id: 'usr-tch-1',
      name: INITIAL_TEACHERS[0].name,
      email: INITIAL_TEACHERS[0].email,
      role: 'TEACHER',
      teacherId: INITIAL_TEACHERS[0].id,
      phone: INITIAL_TEACHERS[0].phone
    }
  },
  'vikram@aksharconnect.demo': {
    password: 'teacher123',
    user: {
      id: 'usr-tch-2',
      name: INITIAL_TEACHERS[1].name,
      email: INITIAL_TEACHERS[1].email,
      role: 'TEACHER',
      teacherId: INITIAL_TEACHERS[1].id,
      phone: INITIAL_TEACHERS[1].phone
    }
  },
  'anita@aksharconnect.demo': {
    password: 'teacher123',
    user: {
      id: 'usr-tch-3',
      name: INITIAL_TEACHERS[2].name,
      email: INITIAL_TEACHERS[2].email,
      role: 'TEACHER',
      teacherId: INITIAL_TEACHERS[2].id,
      phone: INITIAL_TEACHERS[2].phone
    }
  },
  'suresh@aksharconnect.demo': {
    password: 'teacher123',
    user: {
      id: 'usr-tch-4',
      name: INITIAL_TEACHERS[3].name,
      email: INITIAL_TEACHERS[3].email,
      role: 'TEACHER',
      teacherId: INITIAL_TEACHERS[3].id,
      phone: INITIAL_TEACHERS[3].phone
    }
  }
};

class AuthService {
  private currentUser: User | null = null;
  private listeners: ((user: User | null) => void)[] = [];

  constructor() {
    this.restoreSession();
  }

  private restoreSession(): void {
    try {
      const stored = localStorage.getItem(SESSION_KEY);
      if (stored) {
        this.currentUser = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to restore session from localStorage', e);
      this.currentUser = null;
    }
  }

  public getCurrentUser(): User | null {
    if (!this.currentUser) {
      this.restoreSession();
    }
    return this.currentUser;
  }

  public async login(email: string, password: string): Promise<User> {
    const normalizedEmail = email.trim().toLowerCase();
    const account = DEMO_CREDENTIALS[normalizedEmail];

    if (!account) {
      throw new Error('Invalid email or user not found. Check demo credentials.');
    }

    if (account.password !== password) {
      throw new Error('Invalid password. Please try again.');
    }

    this.currentUser = account.user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(account.user));
    this.notify();
    return account.user;
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    this.notify();
  }

  public subscribe(callback: (user: User | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notify(): void {
    this.listeners.forEach(cb => cb(this.currentUser));
  }
}

export const authService = new AuthService();
export { DEMO_CREDENTIALS };
