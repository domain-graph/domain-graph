import { defaultState, GraphState } from '../types';
import {
  addDeletedArgIdsToFieldEdit,
  setArgAsDeleted,
} from './higher-order-reducers';

describe('Higher order arg reducers', () => {
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
      const result = setArgAsDeleted(argId)(originalState);

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
      const result = setArgAsDeleted(argId)(originalState);

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
      const result = setArgAsDeleted(argId)(originalState);

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
      const result = setArgAsDeleted('some-other-arg')(originalState);

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
      const result = addDeletedArgIdsToFieldEdit(
        [argId],
        fieldId,
      )(originalState);

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
      const result = addDeletedArgIdsToFieldEdit(
        [argId],
        fieldId,
      )(originalState);

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
      const result = addDeletedArgIdsToFieldEdit(
        [argId],
        fieldId,
      )(originalState);

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
});
