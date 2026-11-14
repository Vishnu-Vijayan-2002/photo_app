/**
 * AeroShutter Network Connectivity Monitor
 * Tracks network state (Wi-Fi, Cellular, Offline) to enforce upload policies.
 */

export type NetworkType = 'WIFI' | 'CELLULAR' | 'NONE' | 'UNKNOWN';

export interface NetworkState {
  isConnected: boolean;
  type: NetworkType;
  isWifi: boolean;
  isCellular: boolean;
  isInternetReachable: boolean;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private state: NetworkState = {
    isConnected: true,
    type: 'WIFI',
    isWifi: true,
    isCellular: false,
    isInternetReachable: true,
  };

  private listeners: Set<(state: NetworkState) => void> = new Set();

  public static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  public getState(): NetworkState {
    return { ...this.state };
  }

  public setSimulatedState(newState: Partial<NetworkState>) {
    this.state = { ...this.state, ...newState };
    this.notify();
  }

  public subscribe(listener: (state: NetworkState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach((l) => {
      try {
        l(this.getState());
      } catch (e) {
        console.error('Error notifying network listener', e);
      }
    });
  }
}

export const networkMonitor = NetworkMonitor.getInstance();
