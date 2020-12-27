import { StateRepository, GraphState } from '.';

export class NullStateRepository implements StateRepository {
  has(): Promise<boolean> {
    return Promise.resolve(false);
  }
  get(): Promise<GraphState | null> {
    return Promise.resolve(null);
  }
  set(): Promise<void> {
    return Promise.resolve();
  }
  delete(): Promise<void> {
    return Promise.resolve();
  }
}
