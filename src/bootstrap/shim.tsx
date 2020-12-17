import React from 'react';

import { DomainGraph } from '../domain-graph';
import { Schema } from '../tools/types';

const schema: Schema = require('./data/schema.json');

export const Shim: React.FC<{}> = () => {
  return <DomainGraph schema={schema} />;
};
