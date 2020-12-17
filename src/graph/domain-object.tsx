import './domain-object.less';

import React, { useCallback, useLayoutEffect, useRef, useState } from 'react';

import { Node } from './types';
import { useNodeMutation } from './simulation';
import EyeOff from '../icons/eye-off';
import Lock from '../icons/lock';
import Unlock from '../icons/unlock';
import Info from '../icons/info';
import Graph from '../icons/graph';
import { CircleButton, RectButton } from '../svg-button';
import { RadialMenu } from './radial-menu';

export interface DomainObjectProps {
  node: Node;
  isSelected: boolean;
  onPin: (id: string) => void;
  onUnpin: (id: string) => void;
  onHide: (id: string) => void;
  onExpand: (id: string) => void;
  onSelect: (id: string) => void;
}

export const DomainObject: React.FC<DomainObjectProps> = ({
  node,
  isSelected,
  onPin,
  onUnpin,
  onHide,
  onExpand,
  onSelect,
}) => {
  const handle = useRef<SVGGElement>(null);
  const controls = useRef<SVGGElement>(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isPinned, setIsPinned] = useState(false);

  useNodeMutation(node.id, (event, { x, y }) => {
    if (event === 'dragstart') {
      setIsDragging(true);
      onPin(node.id);
      setIsPinned(true);
    } else if (event === 'dragend') {
      setIsDragging(false);
    }

    if (handle.current && controls.current && event === 'tick') {
      handle.current.setAttribute('transform', `translate(${x} ${y})`);
      controls.current.setAttribute('transform', `translate(${x} ${y})`);
    }
  });

  const handleClickHide = useCallback(() => {
    onHide(node.id);
  }, [node, onHide]);

  const handleClickPin = useCallback(() => {
    node.fixed ? onUnpin(node.id) : onPin(node.id);
    setIsPinned(!node.fixed);
  }, [node, onPin, onUnpin]);

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
              {node.fixed ? (
                <Lock size={16} x={-8} y={-8} />
              ) : (
                <Unlock size={16} x={-8} y={-8} />
              )}
            </CircleButton>
            <CircleButton r={14} onClick={() => onExpand(node.id)}>
              <Graph size={16} x={-8} y={-8} />
            </CircleButton>
          </RadialMenu>
        </g>
      </g>
      <g
        ref={handle}
        className="handle"
        id={node.id}
        onClick={() => onSelect(node.id)}
      >
        <circle r="30" />
        <text>{node.id}</text>
      </g>
    </g>
  );
};
