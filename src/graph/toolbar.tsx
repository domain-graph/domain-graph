import './toolbar.less';

import React, { useCallback } from 'react';
import * as Icons from '../icons';
import { useDispatch } from '../state';
import { hideAllNodes, hideUnpinnedNodes } from '../state/graph/graph-actions';
import { PillButton } from '../components/pill-button';

export interface ToolbarProps {
  onResetZoom(): void;
  onFitAll(): void;
}

export const Toolbar: React.VFC<ToolbarProps> = ({ onResetZoom }) => {
  const dispatch = useDispatch();
  const handleHideAll = useCallback(() => {
    dispatch(hideAllNodes() as any); // TODO: (issue: #40)
    onResetZoom();
  }, [dispatch, onResetZoom]);

  const handleHideUnpinned = useCallback(() => {
    dispatch(hideUnpinnedNodes() as any); // TODO: (issue: #40)
  }, [dispatch]);
  return (
    <div className="c-toolbar">
      <PillButton icon={Icons.EyeOff} onClick={handleHideAll}>
        Hide all
      </PillButton>
      <PillButton icon={Icons.Unlock} onClick={handleHideUnpinned}>
        Hide unpinned
      </PillButton>
      {/* <PillButton icon={Icons.Lock} onClick={onFitAll}>
        Fit all
      </PillButton> */}
      <PillButton icon={Icons.Home} onClick={onResetZoom}>
        Reset view
      </PillButton>
    </div>
  );
};
