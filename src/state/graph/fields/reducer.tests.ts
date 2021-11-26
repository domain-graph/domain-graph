import { describeAction } from '../../../test-utils';
import { Action } from '../reducer';
import { defaultState, GraphState } from '../types';
import { reducer } from './reducer';
import { Field } from './types';

describe('field reducer', () => {
  let originalState: GraphState;
  beforeEach(() => {
    originalState = JSON.parse(JSON.stringify(defaultState));
  });

  describeAction('edit/edit_field', (type) => {
    it('edits an existing field', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          edgeIds: [],
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
          edgeIds: [],
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
          edgeIds: [],
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
          edgeIds: [],
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
          edgeIds: [],
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
          edgeIds: [],
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
      const node1Id = 'node-1';
      const node2Id = 'node-2';
      const fieldId = 'field-1';
      const edgeId = 'node-1>node-2';
      originalState.nodes = {
        [node1Id]: {
          id: node1Id,
          description: 'original description',
          edgeIds: [],
          fieldIds: [fieldId],
        },
      };
      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId: node1Id,
          argIds: [],
          name: 'someField',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: false,
          isNotNull: false,
        },
      };
      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: node1Id,
          name: 'otherField',
        },
      };

      const action: Action = {
        type,
        payload: fieldId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {},
      });
    });

    it('restores an existing edge marked as deleted', () => {
      // ARRANGE
      const node1Id = 'node-1';
      const node2Id = 'node-2';
      const fieldId = 'field-1';
      const edgeId = 'node-1>node-2';

      originalState.nodes = {
        [node1Id]: {
          id: node1Id,
          description: 'source node',
          edgeIds: [],
          fieldIds: [fieldId],
        },
        [node2Id]: {
          id: node2Id,
          description: 'target node',
          edgeIds: [],
          fieldIds: [fieldId],
        },
      };
      originalState.edges = {
        [edgeId]: {
          id: edgeId,
          sourceNodeId: node1Id,
          targetNodeId: node2Id,
          fieldIds: [fieldId],
        },
      };
      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId: node1Id,
          edgeId,
          isReverse: false,
          argIds: [],
          name: 'someField',
          typeKind: 'OBJECT',
          typeName: node2Id,
          isList: false,
          isNotNull: false,
        },
      };
      originalState.nodeEdits = {
        [node1Id]: {
          id: node1Id,
          deletedFieldIds: [fieldId],
        },
      };
      originalState.edgeEdits = {
        [edgeId]: {
          id: edgeId,
          sourceNodeId: node1Id,
          targetNodeId: node2Id,
          isDeleted: true,
        },
      };
      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: node1Id,
          isDeleted: true,
        },
      };

      const action: Action = {
        type,
        payload: fieldId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        nodeEdits: {},
        edgeEdits: {},
        fieldEdits: {},
      });
    });

    it('no-ops if the field is net-new', () => {
      // ARRANGE
      originalState.nodes = {
        ['node-1']: {
          id: 'node-1',
          edgeIds: [],
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
      // ARRANGE
      const nodeId = 'node-1';
      const fieldId = 'field-1';
      const edgeId = 'edge-1';
      originalState.nodes = {
        [nodeId]: {
          id: nodeId,
          description: 'original description',
          edgeIds: [],
          fieldIds: [fieldId],
        },
      };
      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
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
          nodeId,
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
          [nodeId]: {
            id: nodeId,
            createdFieldIds: ['field-2'],
          },
        },
        fieldEdits: {
          ['field-2']: {
            id: 'field-2',
            nodeId,
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

    it('creates an edge if the field has an object type', () => {
      // ARRANGE
      const node1Id = 'node-1';
      const node2Id = 'node-2';
      const fieldId = 'field-1';
      const edgeId = 'node-1>node-2';
      originalState.nodes = {
        [node1Id]: {
          id: node1Id,
          description: 'some node',
          edgeIds: [],
          fieldIds: [],
        },
        [node2Id]: {
          id: node2Id,
          description: 'another node',
          edgeIds: [],
          fieldIds: [],
        },
      };

      const action: Action = {
        type,
        payload: {
          id: fieldId,
          nodeId: node1Id,
          name: 'some field',
          typeKind: 'OBJECT',
          typeName: node2Id,
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
          [node1Id]: {
            id: node1Id,
            createdFieldIds: [fieldId],
          },
        },
        edgeEdits: {
          [edgeId]: {
            id: edgeId,
            sourceNodeId: node1Id,
            targetNodeId: node2Id,
            createdFieldIds: [fieldId],
            isNew: true,
          },
        },
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId: node1Id,
            edgeId,
            name: 'some field',
            typeKind: 'OBJECT',
            typeName: node2Id,
            isReverse: false,
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
          edgeIds: [],
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
          edgeIds: [],
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
