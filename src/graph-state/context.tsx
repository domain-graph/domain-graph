import React, { createContext, useContext } from 'react';
import { StateRepository, NullStateRepository } from '.';

const context = createContext<StateRepository>(new NullStateRepository());

export function useStateRepository(): StateRepository {
  return useContext(context);
}

export const StateRepositoryProvider: React.FC<{
  stateRepository: StateRepository;
}> = ({ stateRepository, children }) => {
  return (
    <context.Provider value={stateRepository}>{children}</context.Provider>
  );
};
