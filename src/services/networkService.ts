import { useEffect, useState } from 'react';

type NetworkCallback = (isOnline: boolean) => void;

class NetworkServiceManager {
  private isOnlineStatus: boolean = true;
  private listeners: Set<NetworkCallback> = new Set();

  constructor() {
    if (
      typeof window !== 'undefined' &&
      typeof window.addEventListener === 'function'
    ) {
      if (typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean') {
        this.isOnlineStatus = navigator.onLine;
      }

      try {
        window.addEventListener('online', () => this.setOnline(true));
        window.addEventListener('offline', () => this.setOnline(false));
      } catch (e) {
        console.warn('Network event listener not supported in this JS environment:', e);
      }
    }
  }

  public get isOnline(): boolean {
    return this.isOnlineStatus;
  }

  public setOnline(status: boolean) {
    if (this.isOnlineStatus !== status) {
      this.isOnlineStatus = status;
      this.listeners.forEach((listener) => listener(status));
    }
  }

  public subscribe(callback: NetworkCallback): () => void {
    this.listeners.add(callback);
    callback(this.isOnlineStatus);
    return () => {
      this.listeners.delete(callback);
    };
  }
}

export const networkService = new NetworkServiceManager();

export function useNetworkStatus(): boolean {
  const [isOnline, setIsOnline] = useState(networkService.isOnline);

  useEffect(() => {
    return networkService.subscribe((status) => {
      setIsOnline(status);
    });
  }, []);

  return isOnline;
}
