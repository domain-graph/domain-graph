import './umd.less';

import React from 'react';
import { render } from 'react-dom';
import { DomainGraph } from '../domain-graph';
import { LocalStorageStateRepository } from '../persistence';
import { parse } from 'graphql';

const repository = new LocalStorageStateRepository();

export function mount(rootElementId: string, graphId: string, source: string) {
  const documentNode = parse(source);

  render(
    <DomainGraph
      graphId={graphId}
      documentNode={documentNode}
      repository={repository}
    />,
    document.getElementById(rootElementId),
  );
}
