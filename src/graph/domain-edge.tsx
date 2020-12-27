import './domain-edge.less';

import React, { useLayoutEffect, useRef } from 'react';

import { EdgeGroup } from './types';
import { useEdgeSubscriber } from '../simulation';

import { ChevronDown, ChevronsDown, ChevronsUp, ChevronUp } from '../icons';

export interface DomainEdgeProps {
  edge: EdgeGroup;
  selectedEdgeId?: string;
  onSelect: (ids: string) => void;
}

const handleSize = 20;

export const DomainEdge: React.FC<DomainEdgeProps> = ({
  edge,
  onSelect,
  selectedEdgeId,
}) => {
  const g = useRef<SVGGElement>(null);
  const paths = useRef<SVGPathElement[]>([]);
  const handles = useRef<SVGGElement[]>([]);

  useLayoutEffect(() => {
    paths.current = [];
    handles.current = [];

    if (g.current) {
      for (let i = 0; i < g.current.children.length; i++) {
        const item = g.current.children.item(i);

        if (item?.tagName === 'path') {
          paths.current.push(g.current.children.item(i) as SVGPathElement);
        } else if (item?.tagName === 'g' && item.classList.contains('handle')) {
          handles.current.push(g.current.children.item(i) as SVGGElement);
        }
      }
    }
  }, [edge]);

  useEdgeSubscriber(edge.id, ({ x1, y1, x2, y2 }) => {
    if (g.current && paths.current?.length) {
      const count = paths.current.length;

      if (x1 === x2 && y1 === y2) {
        const midpoints = Array.from(Array(count)).map((_, i) => [
          x1,
          y1 + 60 + i * (handleSize + 5),
        ]);

        let w = 30;
        const widthMultiplier = 1.2;

        midpoints.forEach(([xa, ya], i) => {
          paths.current[i].setAttribute(
            'd',
            `M${x1} ${y1} C${x1 + w} ${y1} ${x1 + w} ${ya} ${xa} ${ya} S${
              x1 - w
            } ${y1} ${x1} ${y1}`,
          );

          handles.current[i].setAttribute(
            'transform',
            `translate(${xa} ${ya})rotate(90)translate(${-handleSize / 2 - 2} ${
              -handleSize / 2
            })`,
          );

          w *= widthMultiplier;
        });
      } else {
        const midpoints = getMidPoints(count, x1, y1, x2, y2);
        const angle = (Math.atan2(x2 - x1, y1 - y2) * 180) / Math.PI;

        midpoints.forEach(([xa, ya, x, y], i) => {
          paths.current[i].setAttribute(
            'd',
            `M${x1} ${y1} Q${xa} ${ya} ${x2} ${y2}`,
          );

          handles.current[i].setAttribute(
            'transform',
            `translate(${x} ${y})rotate(${angle})translate(${-handleSize / 2} ${
              -handleSize / 2
            })`,
          );
        });
      }
    }
  });

  return (
    <g id={edge.id} className="c-domain-edge edge" ref={g}>
      {edge.edges.map((e) => (
        <React.Fragment key={e.name}>
          <path
            className={`${e.optional ? 'optional' : 'required'}${
              selectedEdgeId === e.id ? ' selected' : ''
            }`}
          />
          <g
            className={`handle${selectedEdgeId === e.id ? ' selected' : ''}`}
            onClick={() => onSelect(e.id)}
          >
            <rect width={handleSize} height={handleSize} />
            {e.plurality === 'array' ? (
              e.reverse && edge.source !== edge.target ? (
                <ChevronsDown size={handleSize} />
              ) : (
                <ChevronsUp size={handleSize} />
              )
            ) : e.reverse && edge.source !== edge.target ? (
              <ChevronDown size={handleSize} />
            ) : (
              <ChevronUp size={handleSize} />
            )}
          </g>
        </React.Fragment>
      ))}
    </g>
  );
};

function getMidPoints(
  count: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
): [number, number, number, number][] {
  const spread = handleSize * 2.45;

  const dx = x2 - x1;
  const dy = y2 - y1;

  const xm = (x1 + x2) / 2;
  const ym = (y1 + y2) / 2;

  const l = Math.sqrt(dx * dx + dy * dy);

  const midpoints: [number, number, number, number][] = [];

  for (let i = 0; i < count; i++) {
    const r = (((count - 1) / 2 - i) * spread) / l;

    const xa = xm - dy * r;
    const ya = ym + dx * r;

    const x = (x1 + x2 + 2 * xa) / 4;
    const y = (y1 + y2 + 2 * ya) / 4;

    midpoints[i] = [xa, ya, x, y];
  }

  return midpoints;
}
