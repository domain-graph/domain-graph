import { describeAction } from '../../../test-utils';
import { Action } from '../reducer';
import { defaultState, GraphState } from '../types';
import { reducer } from './reducer';

describe('arg reducer', () => {
  let originalState: GraphState;
  beforeEach(() => {
    originalState = JSON.parse(JSON.stringify(defaultState));
  });

  describeAction('edit/delete_arg', (type) => {
    it('marks an existing arg as deleted', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {
          [argId]: {
            id: argId,
            fieldId,
            isDeleted: true,
          },
        },
      });
    });

    it('unsets a net-new ArgEdit', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({ ...originalState, argEdits: {} });
    });

    it('no-ops if the arg is already marked as deleted', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
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
          fieldId,
          isDeleted: true,
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe(originalState);
    });

    it('no-ops if the arg does not exist', () => {
      // ARRANGEs
      const argId = 'arg-1';

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe(originalState);
    });
  });

  describeAction('edit/restore_arg', (type) => {
    it('removes an non-net-new ArgEdit', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
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
          fieldId,
          name: 'someOtherArgName',
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {},
      });
    });

    it('no-ops for net-new ArgEdits', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someNewArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when there is no existing arg', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someOtherArgName',
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when there is no ArgEdit for an existing arg', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      const action: Action = {
        type,
        payload: argId,
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/edit_arg', (type) => {
    it('sets an ArgEdit for an existing arg', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: argId,
          name: 'someOtherName',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {
          [argId]: {
            id: argId,
            fieldId,
            name: 'someOtherName',
          },
        },
      });
    });

    it('patches an ArgEdit for a net-new arg', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: argId,
          name: 'someOtherName',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toEqual<GraphState>({
        ...originalState,
        argEdits: {
          [argId]: {
            id: argId,
            fieldId,
            name: 'someOtherName',
            typeKind: 'SCALAR',
            typeName: 'String',
            isNotNull: true,
            isList: false,
            isNew: true,
          },
        },
      });
    });

    it('no-ops when there is no existing arg or net-new ArgEdit', () => {
      // ARRANGE
      const argId = 'arg-1';

      const action: Action = {
        type,
        payload: {
          id: argId,
          name: 'someOtherName',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });

    it('no-ops when an existing arg is already marked as deleted', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
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
          fieldId,
          isDeleted: true,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: argId,
          name: 'someOtherName',
        },
      };

      // ACT
      const result = reducer(originalState, action);

      // ASSERT
      expect(result).toBe<GraphState>(originalState);
    });
  });

  describeAction('edit/create_arg', (type) => {
    it('creates a net-new arg', () => {
      // ARRANGE
      const nodeId = 'node-1';
      const fieldId = 'field-1';
      const argId = 'arg-1';

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
          id: argId,
          fieldId,
          name: 'someNewArg',
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
        fieldEdits: {
          [fieldId]: {
            id: fieldId,
            nodeId,
            createdArgIds: [argId],
          },
        },
        argEdits: {
          [argId]: {
            id: argId,
            fieldId,
            name: 'someNewArg',
            typeKind: 'SCALAR',
            typeName: 'String',
            isNotNull: true,
            isList: false,
            isNew: true,
          },
        },
      });
    });

    it('no-ops when there is an existing arg with the same ID', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.args = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: argId,
          fieldId,
          name: 'someNewArg',
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

    it('no-ops when there is a net-new arg with the same ID', () => {
      // ARRANGE
      const fieldId = 'field-1';
      const argId = 'arg-1';

      originalState.argEdits = {
        [argId]: {
          id: argId,
          fieldId,
          name: 'someArg',
          typeKind: 'SCALAR',
          typeName: 'String',
          isNotNull: true,
          isList: false,
          isNew: true,
        },
      };

      const action: Action = {
        type,
        payload: {
          id: argId,
          fieldId,
          name: 'someNewArg',
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
  });
});
