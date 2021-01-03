import { describeAction } from '../../test-utils';
import { EditAction } from './edit-actions';
import { GraphAction } from './graph-actions';
import { reducer } from './reducer';

type Action = EditAction | GraphAction;

import {
  defaultState,
  Field,
  FieldEdit,
  GraphState,
  Node,
  NodeEdit,
} from './types';

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

  describeAction('edit/edit_field', (type) => {
    it('edits an existing field', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: ['field-1'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          description: 'an optional string',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: 'field-1',
          description: 'an optional list of strings',
          isList: true,
          isListElementNotNull: true,
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          ['field-1']: {
            id: 'field-1',
            nodeId: 'node-1',
            description: 'an optional list of strings',
            isList: true,
            isListElementNotNull: true,
            isDeleted: false,
          },
        },
      });
    });

    it('no-ops if field does not yet exist', () => {
      // ARRANGE
      originalState.nodes = {
        'node-1': {
          id: 'node-1',
          fieldIds: [],
        },
      };

      const validField: Field = {
        id: 'field-1',
        nodeId: 'node-1',
        name: 'someField',
        typeKind: 'SCALAR',
        typeName: 'String',
        isList: false,
        isNotNull: false,
        isReverse: false,
        argIds: [],
      };

      const action: Action = {
        type,
        payload: validField,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops if the existing field is not changed', () => {
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: ['field-1'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          description: 'an optional string',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };
      const action: Action = {
        type,
        payload: {
          id: 'field-1',
          description: 'an optional string',
          isList: false,
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/delete_field', (type) => {
    it('marks an existing field as deleted', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: ['field-1', 'field-2'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          description: 'an optional string',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
        ['field-2']: {
          id: 'field-2',
          nodeId: 'node-1',
          argIds: [],
          name: 'some other field',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };

      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            deletedFieldIds: ['field-1'],
          },
        },
        fieldEdits: {
          ['field-1']: {
            id: 'field-1',
            nodeId: 'node-1',
            isDeleted: true,
          },
        },
      });
    });

    it('marks an existing field as deleted removes any existing field edit', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: ['field-1', 'field-2'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          description: 'an optional string',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
        ['field-2']: {
          id: 'field-2',
          nodeId: 'node-1',
          argIds: [],
          name: 'some other field',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };
      originalState.fieldEdits = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          name: 'some new name',
        },
      };

      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            deletedFieldIds: ['field-1'],
          },
        },
        fieldEdits: {
          ['field-1']: {
            id: 'field-1',
            nodeId: 'node-1',
            isDeleted: true,
          },
        },
      });
    });

    it('removes a net-new field', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: ['field-2'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          description: 'an optional string',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
        ['field-2']: {
          id: 'field-2',
          nodeId: 'node-1',
          argIds: [],
          name: 'some other field',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          createdFieldIds: ['field-1'],
        },
      };
      originalState.fieldEdits = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {},
        fieldEdits: {},
      });
    });

    it('no-ops if there is no existing field', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/restore_field', (type) => {
    it('removes an edit for the specified field', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: ['field-1'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };
      originalState.fieldEdits = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          name: 'otherField',
        },
      };

      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {},
      });
    });

    it('no-ops if the field is net-new', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          fieldIds: [],
        },
      };
      originalState.nodeEdits = {
        ['node-1']: {
          id: 'node-1',
          createdFieldIds: ['field-1'],
          isNew: true,
        },
      };
      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops if there is no existing field edit', () => {
      // ARRANGE
      const action: Action = {
        type,
        payload: 'field-1',
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/create_field', (type) => {
    it('creates an edit flagged as new', () => {
      // ARRANGEs
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: ['field-1'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: 'field-2',
          nodeId: 'node-1',
          name: 'newField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {
          ['node-1']: {
            id: 'node-1',
            createdFieldIds: ['field-2'],
          },
        },
        fieldEdits: {
          ['field-2']: {
            id: 'field-2',
            nodeId: 'node-1',
            name: 'newField',
            typeKind: 'SCALAR',
            typeName: 'String',
            isNotNull: true,
            isList: false,
            isNew: true,
          },
        },
      });
    });

    it('no-ops if a field with the same ID already exists', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          description: 'original description',
          fieldIds: ['field-1'],
        },
      };
      originalState.fields = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: 'field-1',
          nodeId: 'node-1',
          name: 'newField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops if a fieldEdit with the same ID already exists', () => {
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
          createdFieldIds: ['field-1'],
        },
      };
      originalState.fieldEdits = {
        ['field-1']: {
          id: 'field-1',
          nodeId: 'node-1',
          argIds: [],
          name: 'someField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: 'field-1',
          nodeId: 'node-1',
          name: 'some other name',
          typeKind: 'SCALAR',
          typeName: 'Int',
          isNotNull: true,
          isList: false,
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });
});
