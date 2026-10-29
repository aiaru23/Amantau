import AsyncStorage from '@react-native-async-storage/async-storage';

export interface UserProfile {
  id: string;
  username: string;
  phoneNumber: string;
  password?: string;
  bio?: string;
  experienceLevel?: string;
  avatarEmoji?: string;
  createdAt: number;
}

const STORAGE_KEYS = {
  USERS_LIST: '@amantau_users_list',
  CURRENT_USER_SESSION: '@amantau_current_user_session',
};

const CLOUD_USERS_ENDPOINT = 'https://api.restful-api.dev/objects/ff808181a09d98f701a125a79e203561';

export function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.slice(1);
  }
  if (!digits.startsWith('7') && digits.length === 10) {
    digits = '7' + digits;
  }
  return digits ? '+' + digits : '';
}

class AuthServiceManager {
  private currentUser: UserProfile | null = null;

  public async initSession(): Promise<UserProfile | null> {
    try {
      const sessionData = await AsyncStorage.getItem(STORAGE_KEYS.CURRENT_USER_SESSION);
      if (sessionData) {
        this.currentUser = JSON.parse(sessionData);
      }
      this.syncCloudUsers().catch(() => {});
      return this.currentUser;
    } catch {
      return this.currentUser;
    }
  }

  public getCurrentUser(): UserProfile | null {
    return this.currentUser;
  }

  public async register(
    username: string,
    phoneNumber: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    const cleanPhone = normalizePhone(phoneNumber);
    const cleanName = username.trim();

    if (!cleanName || !cleanPhone || !password) {
      return { success: false, error: 'Заполните все обязательные поля.' };
    }

    if (cleanPhone.length < 8) {
      return { success: false, error: 'Введите корректный номер телефона (например +77011234567).' };
    }

    await this.syncCloudUsers();
    const localUsers = await this.getLocalUsers();
    const existing = localUsers.find((u) => u.phoneNumber === cleanPhone);

    if (existing) {
      return { success: false, error: 'Аккаунт с таким номером телефона уже существует! Перейдите во вкладку Вход.' };
    }

    const newUser: UserProfile = {
      id: `user_${cleanPhone.replace('+', '')}`,
      username: cleanName,
      phoneNumber: cleanPhone,
      password,
      bio: 'Готов к новым горным маршрутам!',
      experienceLevel: 'Любитель',
      avatarEmoji: '🥾',
      createdAt: Date.now(),
    };

    const updatedUsers = [newUser, ...localUsers.filter((u) => u.id !== newUser.id)];
    await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updatedUsers));

    this.currentUser = newUser;
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(newUser));

    this.saveUserToCloud(newUser).catch(() => {});

    return { success: true, user: newUser };
  }

  public async login(
    phoneNumber: string,
    password: string
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    const cleanPhone = normalizePhone(phoneNumber);

    if (!cleanPhone || !password) {
      return { success: false, error: 'Введите номер телефона и пароль.' };
    }

    let allUsers = await this.getLocalUsers();
    let found = allUsers.find((u) => u.phoneNumber === cleanPhone);

    if (!found) {
      await this.syncCloudUsers();
      allUsers = await this.getLocalUsers();
      found = allUsers.find((u) => u.phoneNumber === cleanPhone);
    }

    if (!found) {
      return { success: false, error: 'Аккаунт с таким номером не найден. Проверьте номер или зарегистрируйтесь.' };
    }

    if (found.password && found.password !== password) {
      return { success: false, error: 'Неверный пароль!' };
    }

    this.currentUser = found;
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(found));

    return { success: true, user: found };
  }

  public async logout(): Promise<void> {
    this.currentUser = null;
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
  }

  public async getAllUsers(): Promise<UserProfile[]> {
    await this.syncCloudUsers();
    return this.getLocalUsers();
  }

  private async getLocalUsers(): Promise<UserProfile[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USERS_LIST);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public async updateProfile(
    updates: Partial<UserProfile>
  ): Promise<UserProfile | null> {
    if (!this.currentUser) return null;

    const updated = { ...this.currentUser, ...updates };
    this.currentUser = updated;
    await AsyncStorage.setItem(STORAGE_KEYS.CURRENT_USER_SESSION, JSON.stringify(updated));

    const localUsers = await this.getLocalUsers();
    const updatedUsers = localUsers.map((u) => (u.id === updated.id ? updated : u));
    await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updatedUsers));

    this.saveUserToCloud(updated).catch(() => {});

    return updated;
  }

  public async deleteUser(userId: string): Promise<void> {
    const localUsers = await this.getLocalUsers();
    const updatedUsers = localUsers.filter((u) => u.id !== userId);
    await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(updatedUsers));

    if (this.currentUser && this.currentUser.id === userId) {
      await this.logout();
    }

    try {
      await fetch(CLOUD_USERS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'AmanTau Users Registry',
          data: { users: updatedUsers },
        }),
      });
    } catch {
      // offline fallback
    }
  }

  public async clearUsersDatabase(): Promise<void> {
    await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify([]));
    await AsyncStorage.removeItem(STORAGE_KEYS.CURRENT_USER_SESSION);
    this.currentUser = null;

    try {
      await fetch(CLOUD_USERS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'AmanTau Users Registry',
          data: { users: [] },
        }),
      });
    } catch {
      // offline fallback
    }
  }

  private async saveUserToCloud(user: UserProfile) {
    try {
      const currentCloudUsers = await this.fetchCloudUsers();
      const userMap = new Map<string, UserProfile>();
      currentCloudUsers.forEach((u) => userMap.set(u.id, u));
      userMap.set(user.id, user);

      const updatedList = Array.from(userMap.values());

      await fetch(CLOUD_USERS_ENDPOINT, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'AmanTau Users Registry',
          data: { users: updatedList },
        }),
      });
    } catch {
      // offline fallback
    }
  }

  private async fetchCloudUsers(): Promise<UserProfile[]> {
    try {
      const response = await fetch(CLOUD_USERS_ENDPOINT);
      const json = await response.json();
      if (json && json.data && Array.isArray(json.data.users)) {
        return json.data.users;
      }
      return [];
    } catch {
      return [];
    }
  }

  private async syncCloudUsers(): Promise<void> {
    try {
      const cloudUsers = await this.fetchCloudUsers();
      if (cloudUsers.length > 0) {
        const localUsers = await this.getLocalUsers();
        const userMap = new Map<string, UserProfile>();

        localUsers.forEach((u) => userMap.set(u.id, u));
        cloudUsers.forEach((u) => {
          const existing = userMap.get(u.id);
          userMap.set(u.id, existing ? { ...existing, ...u } : u);
        });

        const merged = Array.from(userMap.values());
        await AsyncStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(merged));
      }
    } catch {
      // offline fallback
    }
  }
}

export const authService = new AuthServiceManager();
