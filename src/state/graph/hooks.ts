import { useMemo } from 'react';
import { shallowEqual } from 'react-redux';
import * as fsf from 'flux-standard-functions';

import {
  Node,
  Edge,
  Field,
  VisibleNode,
  edgeDef,
  EdgeEdit,
  NodeEdit,
  Arg,
  ArgEdit,
  argDef,
} from '../types';
import { useSelector } from '..';
import { fieldDef, FieldEdit } from './fields';

export interface Edited<T> {
  current: T;
  original: T | undefined;
  isDeleted: boolean;
}

function getEditedArg(
  original: Arg | undefined,
  edit: ArgEdit | undefined,
): Edited<Arg> | undefined {
  if (original) {
    if (edit) {
      return {
        original,
        current: fsf.patch(original, edit, argDef),
        isDeleted: !!edit?.isDeleted,
      };
    } else {
      return {
        original,
        current: original,
        isDeleted: false,
      };
    }
  } else if (edit) {
    // TODO: don't allow undefined current
    const current: Arg | undefined = original
      ? fsf.patch(original, edit, argDef)
      : argDef.getPayload(edit);

    return {
      original,
      current,
      isDeleted: edit.isDeleted === true,
    };
  }

  return undefined;
}

function getEditedField(
  original: Field | undefined,
  edit: FieldEdit | undefined,
): Edited<Field> {
  if (!edit && original) {
    return {
      original,
      current: original,
      isDeleted: false,
    };
  }

  const argIds = fsf.setEach(
    fsf.unsetEach(original?.argIds || [], edit?.deletedArgIds || []),
    edit?.createdArgIds || [],
  );

  const current: Field | undefined = original
    ? fsf.patch(original, { ...edit, argIds }, fieldDef)
    : fieldDef.getPayload({ ...edit, argIds });

  return {
    original,
    current,
    isDeleted: !!edit?.isDeleted,
  };
}

function getEditedEdge(
  original: Edge | undefined,
  edit: EdgeEdit | undefined,
): Edited<Edge> {
  if (!edit && original) {
    return {
      original,
      current: original,
      isDeleted: false,
    };
  }

  const fieldIds = fsf.setEach(
    fsf.unsetEach(original?.fieldIds || [], edit?.deletedFieldIds || []),
    edit?.createdFieldIds || [],
  );

  const current: Edge | undefined = original
    ? fsf.patch(original, { ...edit, fieldIds }, edgeDef)
    : edgeDef.getPayload({ ...edit, fieldIds });

  return {
    original,
    current,
    isDeleted: !!edit?.isDeleted,
  };
}

function getEditedNode(
  original: Node | undefined,
  edit: NodeEdit | undefined,
): Edited<Node> {
  if (!edit && original) {
    return {
      original,
      current: original,
      isDeleted: false,
    };
  }

  const fieldIds = fsf.setEach(
    fsf.unsetEach(original?.fieldIds || [], edit?.deletedFieldIds || []),
    edit?.createdFieldIds || [],
  );

  const current: Node | undefined = original
    ? fsf.patch(original, { ...edit, fieldIds }, edgeDef)
    : edgeDef.getPayload({ ...edit, fieldIds });

  return {
    original,
    current,
    isDeleted: !!edit?.isDeleted,
  };
}

export function useArg(argId: string): Edited<Arg> | undefined {
  const original = useSelector((state) => state.graph.args[argId]);
  const edit = useSelector((state) => state.graph.argEdits[argId]);

  return useMemo(() => getEditedArg(original, edit), [original, edit]);
}

export function useField(fieldId: string): Edited<Field> | undefined {
  const original = useSelector((state) => state.graph.fields[fieldId]);
  const edit = useSelector((state) => state.graph.fieldEdits[fieldId]);

  return useMemo(() => getEditedField(original, edit), [original, edit]);
}

export function useEdge(edgeId: string): Edited<Edge> | undefined {
  const original = useSelector((state) => state.graph.edges[edgeId]);
  const edit = useSelector((state) => state.graph.edgeEdits[edgeId]);

  return useMemo(() => getEditedEdge(original, edit), [original, edit]);
}

export function useNode(nodeId: string): Edited<Node> | undefined {
  const original = useSelector((state) => state.graph.nodes[nodeId]);
  const edit = useSelector((state) => state.graph.nodeEdits[nodeId]);

  return useMemo(() => getEditedNode(original, edit), [original, edit]);
}

export function useVisibleEdgeIds(): string[] {
  return useSelector((state) => state.graph.visibleEdgeIds);
}
export function useVisibleEdges(): Edited<Edge>[] {
  const { visibleEdgeIds, edges, edgeEdits } = useSelector(
    (state) => state.graph,
  );

  return useMemo(
    () => visibleEdgeIds.map((id) => getEditedEdge(edges[id], edgeEdits[id])),
    [visibleEdgeIds, edges, edgeEdits],
  );
}

export function useVisibleNodeIds(): string[] {
  return useSelector(
    (state) => fsf.deindex(state.graph.visibleNodes).map((x) => x.id),
    shallowEqual,
  );
}

export function useVisibleNodes(): VisibleNode[] {
  const { visibleNodes } = useSelector((state) => state.graph);
  return useMemo(() => fsf.deindex(visibleNodes), [visibleNodes]);
}

export function useFieldIds(nodeId: string): string[] {
  return useSelector(
    (state) => state.graph.nodes[nodeId]?.fieldIds || [],
    shallowEqual,
  );
}

export function useFields(nodeId: string): Field[] {
  const fieldIds = useFieldIds(nodeId);
  const allFields = useSelector((state) => state.graph.fields);

  return useMemo(
    () =>
      fieldIds
        .map((fieldId) => {
          const field = allFields[fieldId];

          if (!field) console.error('Cannot find field by ID:', fieldId);

          return field;
        })
        .filter((x) => x),
    [allFields, fieldIds],
  );
}
