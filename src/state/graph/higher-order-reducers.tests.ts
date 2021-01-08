import { defaultState, GraphState } from './types';
import {
  addCreatedArgIdsToFieldEdit,
  addDeletedArgIdsToFieldEdit,
  setArgAsDeleted,
  unsetEmptyFieldEditArgArrays,
} from './higher-order-reducers';

describe('Higher order arg reducers', () => {
  const action = { type: '' };
  let originalState: GraphState;
  beforeEach(() => {
    originalState = JSON.parse(JSON.stringify(defaultState));
  });

  describe('setArgAsDeleted', () => {
    it('set an ArgEdit for an existing non-deleted arg', () => {
      // ARRANGE
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      // ACT
      const reducer = setArgAsDeleted(argId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {
          [argId]: {
            id: argId,
            fieldId: 'field-1',
            isDeleted: true,
          },
        },
      });
    });

    it('unsets a net-new ArgEdit', () => {
      // ARRANGE
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      // ACT
      const reducer = setArgAsDeleted(argId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {},
      });
    });

    it('no-ops when an existing arg is already marked as deleted', () => {
      // ARRANGE
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          isDeleted: true,
        },
      };

      // ACT
      const reducer = setArgAsDeleted(argId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when an existing arg or net-new ArgEdit', () => {
      // ARRANGE
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      // ACT
      const reducer = setArgAsDeleted('some-other-arg');
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describe('addDeletedArgIdsToFieldEdit', () => {
    it('adds a deleted arg ID when an existing arg is deleted', () => {
      // ARRANGE
      const argId = 'arg-1';
      const fieldId = 'field-a';
      const nodeId = 'node-i';

      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someField',
          argIds: [argId],
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          isDeleted: true,
        },
      };

      // ACT
      const reducer = addDeletedArgIdsToFieldEdit([argId], fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            deletedArgIds: [argId],
          },
        },
      });
    });

    it('adds a deleted arg ID to an existing FieldEdit when an existing arg is deleted', () => {
      // ARRANGE
      const argId = 'arg-1';
      const fieldId = 'field-a';
      const nodeId = 'node-i';

      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someField',
          argIds: [argId],
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someOtherName',
        },
      };
      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          isDeleted: true,
        },
      };

      // ACT
      const reducer = addDeletedArgIdsToFieldEdit([argId], fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            name: 'someOtherName',
            deletedArgIds: [argId],
          },
        },
      });
    });

    it('adds a deleted arg ID when an existing arg is deleted', () => {
      // ARRANGE
      const argId = 'arg-1';
      const fieldId = 'field-a';
      const nodeId = 'node-i';

      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someField',
          argIds: [argId],
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          createdArgIds: [argId],
        },
      };

      // ACT
      const reducer = addDeletedArgIdsToFieldEdit([argId], fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            createdArgIds: [],
          },
        },
      });
    });
  });

  describe('addCreatedArgIdsToFieldEdit', () => {
    it('adds a created arg ID when a net-new arg is created', () => {
      // ARRANGE
      const argId = 'arg-1';
      const fieldId = 'field-a';
      const nodeId = 'node-i';

      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someField',
          argIds: [],
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      // ACT
      const reducer = addCreatedArgIdsToFieldEdit([argId], fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            createdArgIds: [argId],
          },
        },
      });
    });

    it('adds a create arg ID to an existing FieldEdit when a net-new arg is created', () => {
      // ARRANGE
      const argId = 'arg-1';
      const fieldId = 'field-a';
      const nodeId = 'node-i';

      originalState.fields = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someField',
          argIds: [],
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };
      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId,
          name: 'someOtherName',
        },
      };
      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId: 'field-1',
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      // ACT
      const reducer = addCreatedArgIdsToFieldEdit([argId], fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            name: 'someOtherName',
            createdArgIds: [argId],
          },
        },
      });
    });
  });

  describe('unsetEmptyFieldEditArgArrays', () => {
    it('removes empty createdArgIds array', () => {
      // ARRANGE
      const fieldId = 'field-1';

      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: 'node-1',
          description: 'Some other description.',
          createdArgIds: [],
          deletedArgIds: ['arg-1'],
        },
      };

      // ACT
      const reducer = unsetEmptyFieldEditArgArrays(fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId: 'node-1',
            description: 'Some other description.',
            deletedArgIds: ['arg-1'],
          },
        },
      });
    });

    it('removes empty deletedArgIds array', () => {
      // ARRANGE
      const fieldId = 'field-1';

      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: 'node-1',
          description: 'Some other description.',
          createdArgIds: ['arg-1'],
          deletedArgIds: [],
        },
      };

      // ACT
      const reducer = unsetEmptyFieldEditArgArrays(fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId: 'node-1',
            description: 'Some other description.',
            createdArgIds: ['arg-1'],
          },
        },
      });
    });

    it('no-ops when FieldEdit does not exist', () => {
      // ARRANGE
      const fieldId = 'field-1';

      // ACT
      const reducer = unsetEmptyFieldEditArgArrays(fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when no arg arrays are present', () => {
      // ARRANGE
      const fieldId = 'field-1';

      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: 'node-1',
          description: 'Some other description.',
        },
      };

      // ACT
      const reducer = unsetEmptyFieldEditArgArrays(fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when no arg arrays are not empty', () => {
      // ARRANGE
      const fieldId = 'field-1';

      originalState.fieldEdits = {
        [fieldId]: {
          id: fieldId,
          nodeId: 'node-1',
          description: 'Some other description.',
          createdArgIds: ['arg-1'],
          deletedArgIds: ['arg-2'],
        },
      };

      // ACT
      const reducer = unsetEmptyFieldEditArgArrays(fieldId);
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });
});
