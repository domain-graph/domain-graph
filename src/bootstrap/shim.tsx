import React from 'react';

import { DomainGraph } from '../domain-graph';

const introspection = require('./data/schema.json');

export const Shim: React.FC<{}> = () => {
  return <DomainGraph introspection={introspection} />;
};
