import { SaveState, SaveStateRepository } from './types';

export class SubscribedStateRepository implements SaveStateRepository {
  constructor(
    private readonly repository: SaveStateRepository,
    private readonly onState: (id: string, state: SaveState) => void,
  ) {}

  has(id: string): Promise<boolean> {
    return this.repository.has(id);
  }
  get(id: string): Promise<SaveState | null> {
    return this.repository.get(id);
  }
  set(id: string, state: SaveState): Promise<void> {
    this.onState(id, state);
    return this.repository.set(id, state);
  }
  delete(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
