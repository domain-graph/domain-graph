import { SaveState, SaveStateRepository } from './types';

export class LocalStorageStateRepository implements SaveStateRepository {
  private readonly prefix = 'domain-graph-state-object';

  private key(id: string): string {
    return `${this.prefix}:${id}`;
  }

  has(id: string): Promise<boolean> {
    return Promise.resolve(window.localStorage.getItem(this.key(id)) !== null);
  }
  get(id: string): Promise<SaveState | null> {
    const item = window.localStorage.getItem(this.key(id));
    return Promise.resolve(item === null ? null : JSON.parse(item));
  }
  set(id: string, state: SaveState): Promise<void> {
    window.localStorage.setItem(this.key(id), JSON.stringify(state));
    return Promise.resolve();
  }
  delete(id: string): Promise<void> {
    window.localStorage.removeItem(this.key(id));
    return Promise.resolve();
  }
}
