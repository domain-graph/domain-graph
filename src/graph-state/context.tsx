import React, { createContext, useContext, useMemo } from 'react';
import { StateService } from './state-service';
import { StateRepository } from './types';

const context = createContext<StateService | null>(null);

export function useStateService(): StateService | null {
  return useContext(context);
}

export const StateProvider: React.FC<{
  stateService: StateService;
}> = ({ stateService, children }) => {
  return <context.Provider value={stateService}>{children}</context.Provider>;
};
