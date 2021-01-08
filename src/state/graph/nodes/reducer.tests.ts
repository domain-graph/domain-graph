import { describeAction } from '../../../test-utils';
import { Action, reducer } from '../reducer';

import { defaultState, GraphState } from '../types';

describe('reducer', () => {
  let originalState: GraphState;
  beforeEach(() => {
    originalState = JSON.parse(JSON.stringify(defaultState));
  });

  describeAction('edit/edit_node', (type) => {
    it('does not create a new node', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: { id: 'node-1' },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('edits an existing node', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };

      const action: Action = {
        type,
        payload: { id: 'node-1', description: 'new description' },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            description: 'new description',
            isDeleted: false,
          },
        },
      });
    });

    it('no-ops if the existing node is not changed', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };

      const action: Action = {
        type,
        payload: { id: 'node-1', description: 'original description' },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/delete_node', (type) => {
    it('marks an existing node as deleted', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };

      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            isDeleted: true,
          },
        },
      });
    });

    it('marks an existing node as deleted removes any existing node edit', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          description: 'new description',
        },
      };

      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            isDeleted: true,
          },
        },
      });
    });

    it('removes a net-new node', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodes: {},
        nodeEdits: {},
      });
    });

    it('no-ops if there is no existing node', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/restore_node', (type) => {
    it('removes an edit for the specified node', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: [],
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          description: 'new description',
        },
      };
      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {},
      });
    });

    it('no-ops if the node is net-new', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'a new node',
          fieldIds: [],
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          description: 'an updated description',
          isNew: true,
        },
      };
      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops if there is no existing node edit', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: 'node-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/create_node', (type) => {
    it('creates an edit flagged as new', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: {
          id: 'some-node',
          description: 'a new node',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['some-node']: {
            id: 'some-node',
            description: 'a new node',
            isNew: true,
          },
        },
      });
    });

    it('no-ops if a node with the same ID already exists', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'an existing node',
          fieldIds: [],
        },
      };
      const action: Action = {
        type,
        payload: {
          id: 'node-1',
          description: 'a new node',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });
});
