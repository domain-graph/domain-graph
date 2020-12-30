import './domain-object.less';

import React, { useCallback, useRef, useState } from 'react';

import { nodes as nodesEntity } from '../state/nodes';
import * as customNodeActions from '../state/nodes/custom-actions';
import { useNodeSubscriber } from '../simulation';
import { EyeOff, Graph, Lock, Unlock } from '../icons';
import { CircleButton } from '../svg-button';
import { RadialMenu } from './radial-menu';
import { useDispatch, useSelector } from '../state';

export const DomainObject: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const dispatch = useDispatch();
  const { isPinned } = useSelector((state) => state.nodes.data[nodeId]);
  const sourceId = useSelector((state) => state.nodes.selectedSourceNodeId);
  const targetId = useSelector((state) => state.nodes.selectedTargetNodeId);

  const handleClickHide = useCallback(
    () => dispatch(nodesEntity.patch(nodeId, { isVisible: false })),
    [nodeId, dispatch],
  );

  const handleClickPin = useCallback(
    () => dispatch(nodesEntity.patch(nodeId, { isPinned: !isPinned })),
    [nodeId, isPinned, dispatch],
  );

  const handleClickExpand = useCallback(
    () => dispatch(customNodeActions.expandNode(nodeId)),
    [nodeId, dispatch],
  );

  const handleClickSelect = useCallback(
    () => dispatch(customNodeActions.selectNode(nodeId)),
    [nodeId, dispatch],
  );

  const isSelected = nodeId === sourceId || nodeId === targetId;

  const handle = useRef<SVGGElement>(null);
  const controls = useRef<SVGGElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useNodeSubscriber(nodeId, (event, { x, y }) => {
    if (event === 'dragstart') {
      setIsDragging(true);
      if (!isPinned) dispatch(nodesEntity.patch(nodeId, { isPinned: true }));
    } else if (event === 'dragend') {
      setIsDragging(false);
    }

    if (handle.current && controls.current && event === 'tick') {
      handle.current.setAttribute('transform', `translate(${x} ${y})`);
      controls.current.setAttribute('transform', `translate(${x} ${y})`);
    }
  });

  const [showControls, setShowControls] = useState<boolean | null>(null);

  const handleMouseEnter = useCallback(() => {
    setShowControls(true);
  }, []);
  const handleMouseLeave = useCallback(() => {
    setShowControls(false);
  }, []);

  return (
    <g
      className={`c-domain-object simulation-node${
        isDragging ? ' dragging' : ''
      }${isPinned ? ' pinned' : ''}${isSelected ? ' selected' : ''}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <g ref={controls} className={`controls`}>
        <g className={`${showControls ? 'visible' : 'hidden'} control-wheel`}>
          <RadialMenu
            isVisible={showControls}
            radius={52}
            spread={37}
            margin={50}
          >
            <CircleButton r={14} onClick={handleClickHide}>
              <EyeOff size={16} x={-8} y={-8} />
            </CircleButton>
            <CircleButton r={14} onClick={handleClickPin}>
              {isPinned ? (
                <Lock size={16} x={-8} y={-8} />
              ) : (
                <Unlock size={16} x={-8} y={-8} />
              )}
            </CircleButton>
            <CircleButton r={14} onClick={handleClickExpand}>
              <Graph size={16} x={-8} y={-8} />
            </CircleButton>
          </RadialMenu>
        </g>
      </g>
      <g
        ref={handle}
        className="handle"
        id={nodeId}
        onClick={handleClickSelect}
      >
        <circle r="30" />
        <text>{nodeId}</text>
      </g>
    </g>
  );
};
