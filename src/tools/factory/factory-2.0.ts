import { IntrospectionQuery } from 'graphql';
import {
  Arg,
  Edge,
  Enum,
  EnumValue,
  Field,
  Input,
  InputField,
  Node,
} from '../../state/graph';
import {
  isEnumFieldType,
  isScalarFieldType,
  isTypeWithFields,
  Schema,
  SchemaType,
  Field as SchemaField,
  SpecificFieldType,
  InputValue,
  EnumType,
  isInputObjectType,
} from '../types';
import { normalizeFieldType, normalizeInputFieldType } from '../utils';
import { TypeHeuristic, TypeHeuristicResult } from './types';

function createNodeId(type: SchemaType | SpecificFieldType): string {
  return type.name;
}

function createEdgeId(
  source: SchemaType | SpecificFieldType,
  target: SchemaType | SpecificFieldType,
): string {
  return `${source.name}>${target.name}`;
}

function createFieldId(type: SpecificFieldType, field: SchemaField): string {
  return `${type.name}.${field.name}`;
}

function createArgId(
  type: SpecificFieldType,
  field: SchemaField,
  arg: InputValue,
): string {
  return `${type.name}.${field.name}(${arg.name})`;
}

export function getInitialState(
  introspection: IntrospectionQuery,
  heuristics: TypeHeuristic[],
): {
  nodes: Node[];
  edges: Edge[];
  fields: Field[];
  args: Arg[];
  enums: Enum[];
  enumValues: EnumValue[];
  inputs: Input[];
  inputFields: InputField[];
} {
  const schema: Schema = { data: introspection as any };
  const { types } = schema.data.__schema;

  const nodes = new Map<string, Node>();
  const edges = new Map<string, Edge>();
  const fields = new Map<string, Field>();
  const args = new Map<string, Arg>();

  const edgeIdsByFieldId = new Map<string, string>();

  // Run heuristics against all types
  const resultsByCanonicalType = new Map<string, TypeHeuristicResult>();
  const resultsByIgnoredType = new Map<string, TypeHeuristicResult>();
  for (const type of types) {
    for (const heuristic of heuristics) {
      const result = heuristic(type, schema);

      if (result?.canonicalType?.name) {
        resultsByCanonicalType.set(result.canonicalType.name, result);
      }
      if (result?.ignoredTypes) {
        for (const ignoredType of result.ignoredTypes) {
          resultsByIgnoredType.set(ignoredType.name, result);
        }
      }
    }
  }

  const filteredTypes = types
    .filter((t) => !resultsByIgnoredType.has(t.name))
    .filter(isTypeWithFields); // TODO: support union types

  // Build initial state
  for (const type of filteredTypes) {
    // Build Nodes
    const node: Node = {
      id: createNodeId(type),
      description: type.description || undefined,
      edgeIds: [],
      fieldIds: [], // This gets populated in the reducer
    };
    nodes.set(node.id, node);
  }

  // Build Edges
  for (const type of filteredTypes) {
    const nodeId = createNodeId(type);
    if (!nodes.has(nodeId)) continue;
    for (const field of type.fields) {
      const fieldType = normalizeFieldType(field.type);
      if (isScalarFieldType(fieldType.type)) continue;
      if (isEnumFieldType(fieldType.type)) continue;

      const targetType = resultsByIgnoredType.has(fieldType.type.name)
        ? resultsByIgnoredType.get(fieldType.type.name)?.canonicalType
        : fieldType.type;

      if (!targetType) continue;
      if (!nodes.has(targetType?.name)) continue;

      const forwardId = createEdgeId(type, targetType);
      const reverseId = createEdgeId(targetType, type);

      const edgeId = edges.has(reverseId) ? reverseId : forwardId;
      const sourceNodeId = edges.has(reverseId)
        ? createNodeId(targetType)
        : nodeId;
      const targetNodeId = edges.has(reverseId)
        ? nodeId
        : createNodeId(targetType);
      const fieldId = createFieldId(type, field);

      edges.set(edgeId, {
        id: edgeId,
        sourceNodeId,
        targetNodeId,
        fieldIds: [], // This gets populated in the reducer
      });
      edgeIdsByFieldId.set(fieldId, edgeId);
    }
  }

  // Build Fields
  for (const type of filteredTypes) {
    const nodeId = createNodeId(type);
    if (!nodes.has(nodeId)) continue;
    for (const field of type.fields) {
      const fieldType = normalizeFieldType(field.type);

      const hueristicResult = resultsByIgnoredType.get(fieldType.type.name);

      const targetType = hueristicResult
        ? hueristicResult.canonicalType
        : fieldType.type;

      if (!targetType) continue;
      if (targetType.kind === 'INPUT_OBJECT') continue;

      const fieldId = createFieldId(type, field);
      const edgeId = edgeIdsByFieldId.get(fieldId);
      const reverseEdgeId = createEdgeId(targetType, type);

      fields.set(fieldId, {
        id: fieldId,
        nodeId,
        edgeId,
        argIds: [], // This gets populated in the reducer
        isReverse: edgeId === undefined ? undefined : edgeId === reverseEdgeId,
        name: field.name,
        description: field.description || undefined,
        typeKind: targetType.kind,
        typeName: targetType.name,
        isNotNull: fieldType.isNotNull,
        isList: hueristicResult ? hueristicResult.forceList : fieldType.isList,
        isListElementNotNull:
          fieldType.isListElementNotNull === null
            ? undefined
            : fieldType.isListElementNotNull,
      });

      // Build Args
      for (const arg of field.args) {
        const argType = normalizeInputFieldType(arg.type);

        const argId = createArgId(type, field, arg);

        // TODO: put this logic in the heuristic (issue: #47)
        if (hueristicResult?.heuristicName === 'connection') {
          if (arg.name === 'before') continue;
          if (arg.name === 'after') continue;
          if (arg.name === 'first') continue;
          if (arg.name === 'last') continue;
        }

        args.set(argId, {
          id: argId,
          fieldId,
          name: arg.name,
          description: arg.description || undefined,
          defaultValue: arg.defaultValue || undefined,
          typeKind: argType.type.kind,
          typeName: argType.type.name,
          isNotNull: argType.isNotNull,
          isList: argType.isList,
          isListElementNotNull:
            argType.isListElementNotNull === null
              ? undefined
              : argType.isListElementNotNull,
        });
      }
    }
  }

  // Build Enums
  const { enums, enumValues } = getEnums(types);

  // Build Enums
  const { inputs, inputFields } = getInputs(types);

  return {
    nodes: Array.from(nodes.values()),
    edges: Array.from(edges.values()),
    fields: Array.from(fields.values()),
    args: Array.from(args.values()),
    enums: Array.from(enums.values()),
    enumValues: Array.from(enumValues.values()),
    inputs: Array.from(inputs.values()),
    inputFields: Array.from(inputFields.values()),
  };
}

function getEnums(types: SchemaType[]) {
  const enumTypes = types.filter(
    (t: SchemaType): t is EnumType => t.kind === 'ENUM',
  );

  const enums = new Map<string, Enum>();
  const enumValues = new Map<string, EnumValue>();

  for (const e of enumTypes) {
    enums.set(e.name, {
      id: e.name,
      description: e.description === null ? undefined : e.description,
      valueIds: e.enumValues.map((v) => {
        const enumValue: EnumValue = {
          id: `${e.name}.${v.name}`,
          enumId: e.name,
          name: v.name,
          description: v.description === null ? undefined : v.description,
          isDeprecated: v.isDeprecated,
          deprecationReason:
            v.deprecationReason === null ? undefined : v.deprecationReason,
        };

        enumValues.set(enumValue.id, enumValue);

        return enumValue.id;
      }),
    });
  }

  return { enums, enumValues };
}

function getInputs(types: SchemaType[]) {
  const inputTypes = types.filter(isInputObjectType);

  const inputs = new Map<string, Input>();
  const inputFields = new Map<string, InputField>();

  for (const inputType of inputTypes) {
    const inputId = inputType.name;
    inputs.set(inputId, {
      id: inputId,
      description: inputType.description || undefined,
      inputFieldIds: inputType.inputFields.map((field) => {
        const fieldType = normalizeInputFieldType(field.type);

        const inputField: InputField = {
          id: `${inputId}.${field.name}`,
          inputId,
          name: field.name,
          description: field.description || undefined,
          defaultValue: field.defaultValue,
          typeName: fieldType.type.name,
          typeKind: fieldType.type.kind,
          isNotNull: fieldType.isNotNull,
          isList: fieldType.isList,
          isListElementNotNull: fieldType.isListElementNotNull || undefined,
        };

        inputFields.set(inputField.id, inputField);

        return inputField.id;
      }),
    });
  }

  return {
    inputs,
    inputFields,
  };
}
