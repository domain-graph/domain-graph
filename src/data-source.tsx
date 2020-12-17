import React, { useCallback, useContext, useState } from 'react';
import { GraphFactory } from './tools/factory';
import { interospectionHeuristic } from './tools/factory/heuristics/introspection';
import { connectionHeuristic } from './tools/factory/heuristics/relay-connection';
import { Schema } from './tools/types';

import { Edge, Node } from './types';

export interface DataSourceContext {
  nodes: Node[];
  edges: Edge[];
  setSchema: (schema: Schema) => void;
}

const context = React.createContext<DataSourceContext>({
  nodes: [],
  edges: [],
  setSchema: () => {
    // NO-OP
  },
});

export const useDataSource = (): DataSourceContext => useContext(context);

export const DataSource: React.FC = ({ children }) => {
  const setSchema = useCallback((schema: Schema) => {
    const factory = new GraphFactory(
      connectionHeuristic,
      interospectionHeuristic,
    );

    const { nodes, edges } = factory.build(schema);

    setValue({ edges, nodes, setSchema });
  }, []);

  const [value, setValue] = useState<DataSourceContext>({
    nodes: [],
    edges: [],
    setSchema,
  });

  return <context.Provider value={value}>{children}</context.Provider>;
};
