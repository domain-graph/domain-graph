import './domain-object.less';

import React, { useCallback, useRef, useState } from 'react';

import { useNodeSubscriber } from '../simulation';
import { EyeOff, Graph, Lock, Unlock } from '../icons';
import { CircleButton } from '../svg-button';
import { RadialMenu } from './radial-menu';
import { useDispatch, useSelector } from '../state';
import {
  expandNode,
  hideNode,
  updateNodeLocation,
  pinNode,
  selectNode,
  unpinNode,
} from '../state/graph/graph-actions';

export const DomainObject: React.FC<{ nodeId: string }> = ({ nodeId }) => {
  const dispatch = useDispatch();
  const isPinned = useSelector(
    (state) => state.graph.visibleNodes[nodeId]?.isPinned === true,
  );
  const sourceId = useSelector((state) => state.graph.selectedSourceNodeId);
  const targetId = useSelector((state) => state.graph.selectedTargetNodeId);

  const dragStart = useRef<{ x: number; y: number }>();
  const location = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const handleClickHide = useCallback(() => dispatch(hideNode(nodeId)), [
    nodeId,
    dispatch,
  ]);

  const handleClickPin = useCallback(() => {
    const { x, y } = location.current;
    dispatch(isPinned ? unpinNode(nodeId) : pinNode(nodeId, x, y));
  }, [nodeId, isPinned, dispatch]);

  const handleClickExpand = useCallback(() => dispatch(expandNode(nodeId)), [
    nodeId,
    dispatch,
  ]);

  const handleClickSelect = useCallback(() => {
    if (targetId || nodeId !== sourceId) dispatch(selectNode(nodeId));
  }, [nodeId, sourceId, targetId, dispatch]);

  const isSelected = nodeId === sourceId || nodeId === targetId;

  const handle = useRef<SVGGElement>(null);
  const controls = useRef<SVGGElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useNodeSubscriber(nodeId, (event, { x, y }) => {
    if (event === 'dragstart') {
      dragStart.current = { x, y };
      setIsDragging(true);
      if (!isPinned) dispatch(pinNode(nodeId, x, y));
    } else if (event === 'dragend') {
      setIsDragging(false);
      if (
        dragStart.current &&
        (x !== dragStart.current.x || y !== dragStart.current.y)
      ) {
        dispatch(updateNodeLocation(nodeId, x, y));
      }
      dragStart.current = undefined;
    }

    location.current = { x, y };

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
