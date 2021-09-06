import './index.less';

import React, { useCallback, useRef } from 'react';

import { SvgCanvas, SvgCanvasMethods } from '../svg-canvas';
import { DomainObject } from './domain-object';
import { DomainEdge } from './domain-edge';
import { Simulation } from '../simulation';
import { NodePicker } from './node-picker';
import { Spotlight } from './spotlight';
import { useVisibleEdgeIds, useVisibleNodeIds } from '../state/graph/hooks';
import { Toolbar } from './toolbar';

export interface GraphProps {
  className?: string;
}

export const Graph: React.VFC<GraphProps> = () => {
  const nodeIds = useVisibleNodeIds();
  const edgeIds = useVisibleEdgeIds();

  const canvas = useRef<SvgCanvasMethods>(null);

  const handleClickFitAll = useCallback(() => {
    canvas.current?.fitAll?.();
  }, []);

  const handleClickResetZoom = useCallback(() => {
    canvas.current?.resetZoom?.();
  }, []);

  return (
    <Simulation>
      <SvgCanvas ref={canvas}>
        <g>
          {edgeIds.map((edgeId) => (
            <DomainEdge key={edgeId} edgeId={edgeId} />
          ))}
        </g>
        <g>
          {nodeIds.map((nodeId) => (
            <DomainObject key={nodeId} nodeId={nodeId} />
          ))}
        </g>
      </SvgCanvas>
      <Toolbar
        onFitAll={handleClickFitAll}
        onResetZoom={handleClickResetZoom}
      />
      <NodePicker />
      <Spotlight />
    </Simulation>
  );
};
