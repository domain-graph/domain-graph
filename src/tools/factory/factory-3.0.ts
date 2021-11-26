import { index } from 'flux-standard-functions';
import {
  DefinitionNode,
  DocumentNode,
  EnumTypeDefinitionNode,
  EnumValueDefinitionNode,
  FieldDefinitionNode,
  InputObjectTypeDefinitionNode,
  InputObjectTypeExtensionNode,
  InputValueDefinitionNode,
  InterfaceTypeDefinitionNode,
  InterfaceTypeExtensionNode,
  NamedTypeNode,
  ObjectTypeDefinitionNode,
  ObjectTypeExtensionNode,
  SchemaDefinitionNode,
  SchemaExtensionNode,
  TypeNode,
} from 'graphql';
import {
  Arg,
  argDef,
  Edge,
  edgeDef,
  Enum,
  enumDef,
  EnumValue,
  enumValueDef,
  Field,
  fieldDef,
  Input,
  inputDef,
  InputField,
  inputFieldDef,
  Node,
  nodeDef,
} from '../../state/types';
import { SpecificFieldType, SpecificInputFieldType } from '../types';
import { DocumentCache } from './document-cache';
import { V3StateFactory } from './types';

export const factory: V3StateFactory = (document) => ({
  nodes: index(buildNodes(document), nodeDef),
  fields: index(buildFields(document), fieldDef),
  edges: index(buildEdges(document), edgeDef),
  args: index(buildArgs(document), argDef),
  enums: index(buildEnums(document), enumDef),
  enumValues: index(buildEnumValues(document), enumValueDef),
  inputs: index(buildInputs(document), inputDef),
  inputFields: index(buildInputFields(document), inputFieldDef),
});

export function buildNodes(document: DocumentNode): Node[] {
  return document.definitions.filter(isNodeSource).map((n) =>
    compact({
      id: buildNodeId(n),
      fieldIds: n.fields?.map((f) => buildFieldId(n, f)) || [],
      description: n.description?.value,
    }),
  );
}

export function buildFields(document: DocumentNode): Field[] {
  return Array.from(doBuildFields(new DocumentCache(document)));
}

function* doBuildFields(cache: DocumentCache): Iterable<Field> {
  for (const field of cache.fields()) {
    const node = cache.getDefinitionByField(field);
    if (!node) continue;

    const target = cache.normalizeTypeNode(field.type);
    const targetDefinition = cache.getTypeDefinition(
      target.namedType.name.value,
    );

    const fieldId = buildFieldId(node, field);
    const { edgeId, isReverse } = buildEdgeId(cache, field);

    const legacyTargetTypeKind = toLegacyTypeKind(targetDefinition?.kind);
    if (!legacyTargetTypeKind) continue;

    yield compact({
      id: fieldId,
      name: field.name.value,
      edgeId: edgeId,
      isList: target.isList,
      isNotNull: target.isNotNull,
      isListElementNotNull: target.isListElementNotNull,
      nodeId: buildNodeId(node),
      typeKind: legacyTargetTypeKind,
      typeName: targetDefinition?.name?.value || target.namedType.name.value,
      description: field.description?.value,
      isReverse,
      argIds: field.arguments?.map((a) => buildArgId(node, field, a)) || [],
    });
  }
}

export function buildEdges(document: DocumentNode): Edge[] {
  // return Array.from(doBuildEdges(new DocumentCache(document)));
  const cache = new DocumentCache(document);

  const fieldIdsByEdgeId = new Map<string, Set<string>>();
  const edgesById = new Map<string, Edge>();

  for (const field of cache.fields()) {
    const { edgeId, sourceId, targetId } = buildEdgeId(cache, field);
    if (!edgeId) continue;
    if (!sourceId) continue;
    if (!targetId) continue;

    const node = cache.getDefinitionByField(field);
    if (!node) continue;

    const fieldId = buildFieldId(node, field);

    if (!fieldIdsByEdgeId.has(edgeId)) fieldIdsByEdgeId.set(edgeId, new Set());
    fieldIdsByEdgeId.get(edgeId)!.add(fieldId);

    edgesById.set(
      edgeId,
      compact({
        id: edgeId,
        sourceNodeId: sourceId,
        targetNodeId: targetId,
        fieldIds: [],
      }),
    );
  }

  for (const edge of edgesById.values()) {
    const fieldIds = fieldIdsByEdgeId.get(edge.id);
    edge.fieldIds = fieldIds ? Array.from(fieldIds) : [];
  }

  return Array.from(edgesById.values());
}

export function buildArgs(document: DocumentNode): Arg[] {
  return Array.from(doBuildArgs(new DocumentCache(document)));

  // document.definitions
  //   .filter(isNodeSource)
  //   .map((n) => n.fields?.map((f) => ({ n, f })) || [])
  //   .reduce((a, b) => a.concat(b), [])
  //   .map(({ n, f }) => f.arguments?.map((a) => ({ n, f, a })) || [])
  //   .reduce((a, b) => a.concat(b), [])
  //   .forEach(({ n, f, a }) => {
  //     console.log({ n, f, a });
  //   });

  // return document.definitions
  //   .filter(isNodeSource)
  //   .map((n) => n.fields?.map((f) => ({ n, f })) || [])
  //   .reduce((a, b) => a.concat(b), [])
  //   .map(({ n, f }) => f.arguments?.map((a) => ({ n, f, a })) || [])
  //   .reduce((a, b) => a.concat(b), [])
  //   .map(({ n, f, a }) => {
  //     const {
  //       namedType,
  //       isList,
  //       isNotNull,
  //       isListElementNotNull,
  //     } = normalizeTypeNode(a.type);
  //     const targetDefinition = getTypeDefinition(document, namedType);
  //     const legacyTargetTypeKind = toLegacyInputTypeKind(
  //       targetDefinition?.kind,
  //     );

  //     if (!targetDefinition || !legacyTargetTypeKind) return;

  //     const arg: Arg = {
  //       id: buildArgId(n, f, a),
  //       fieldId: buildFieldId(n, f),
  //       name: a.name.value,
  //       description: a.description?.value,
  //       // defaultValue: TODO
  //       typeKind: legacyTargetTypeKind,
  //       typeName: namedType.name.value,
  //       isList,
  //       isNotNull,
  //       isListElementNotNull,
  //     };
  //     return arg;
  //   })
  //   .filter(isTruthy);
}

function* doBuildArgs(cache: DocumentCache): Iterable<Arg> {
  for (const arg of cache.args()) {
    const field = cache.getDefinitionByInputValue(arg);
    if (field?.kind !== 'FieldDefinition') continue;

    const node = cache.getDefinitionByField(field);
    if (!node) continue;

    const {
      namedType,
      isList,
      isNotNull,
      isListElementNotNull,
    } = normalizeTypeNode(arg.type);
    const targetDefinition = cache.getTypeDefinition(namedType.name.value);

    const legacyTargetTypeKind = toLegacyInputTypeKind(targetDefinition?.kind);

    if (!legacyTargetTypeKind) continue;

    yield compact({
      id: buildArgId(node, field, arg),
      fieldId: buildFieldId(node, field),
      name: arg.name.value,
      description: arg.description?.value,
      // defaultValue: TODO
      typeKind: legacyTargetTypeKind,
      typeName: namedType.name.value,
      isList,
      isNotNull,
      isListElementNotNull,
    });
  }
}

export function buildEnums(document: DocumentNode): Enum[] {
  return document.definitions.filter(isEnumSource).map((e) =>
    compact({
      id: buildEnumId(e),
      description: e.description?.value,
      valueIds: e.values?.map((v) => buildEnumValueId(e, v)) || [],
    }),
  );
}

export function buildEnumValues(document: DocumentNode): EnumValue[] {
  const enumValues: EnumValue[] = document.definitions
    .filter(isEnumSource)
    .map((e) => e.values?.map((v) => ({ e, v })) || [])
    .reduce((a, b) => a.concat(b), [])
    .map(({ e, v }) => {
      return compact({
        id: buildEnumValueId(e, v),
        enumId: buildEnumId(e),
        description: v.description?.value,
        name: v.name.value,
        isDeprecated: !!v.directives?.some(
          (d) => d.name.value === 'deprecated',
        ),
        // deprecationReason: TODO!!!!
      });
    });

  return enumValues;
}

export function buildInputs(document: DocumentNode): Input[] {
  const cache = new DocumentCache(document);
  return Array.from(cache.inputs()).map((n) =>
    compact({
      id: buildNodeId(n),
      inputFieldIds: n.fields?.map((f) => buildFieldId(n, f)) || [],
      description: n.description?.value,
    }),
  );
}

export function buildInputFields(document: DocumentNode): InputField[] {
  return Array.from(doBuildInputFields(new DocumentCache(document)));
}

function* doBuildInputFields(cache: DocumentCache): Iterable<InputField> {
  for (const input of cache.inputs())
    for (const inputField of input.fields || []) {
      const target = cache.normalizeTypeNode(inputField.type);
      const targetDefinition = cache.getTypeDefinition(
        target.namedType.name.value,
      );

      const inputFieldId = buildFieldId(input, inputField);

      const legacyTargetTypeKind = toLegacyInputTypeKind(
        targetDefinition?.kind,
      );
      if (!legacyTargetTypeKind) continue;

      yield compact({
        id: inputFieldId,
        name: input.name.value,
        isList: target.isList,
        isNotNull: target.isNotNull,
        isListElementNotNull: target.isListElementNotNull,
        inputId: buildNodeId(input),
        typeKind: legacyTargetTypeKind,
        typeName: targetDefinition?.name?.value || target.namedType.name.value,
        description: inputField.description?.value,
      });
    }
}

function buildNodeId(
  node:
    | InputObjectTypeDefinitionNode
    | InputObjectTypeExtensionNode
    | InterfaceTypeDefinitionNode
    | InterfaceTypeExtensionNode
    | ObjectTypeDefinitionNode
    | ObjectTypeExtensionNode,
): string {
  return node.name.value;
}

export function buildFieldId(
  typeNode:
    | ObjectTypeDefinitionNode
    | InterfaceTypeDefinitionNode
    | InputObjectTypeDefinitionNode
    | ObjectTypeExtensionNode
    | InterfaceTypeExtensionNode
    | InputObjectTypeExtensionNode,
  fieldNode: FieldDefinitionNode | InputValueDefinitionNode,
): string {
  return `${typeNode.name.value}.${fieldNode.name.value}`;
}

function buildEdgeId(
  cache: DocumentCache,
  field: FieldDefinitionNode,
): {
  edgeId?: string;
  isReverse: boolean;
  sourceId?: string;
  targetId?: string;
} {
  const target = cache.normalizeTypeNode(field.type);
  const targetDefinition = cache.getTypeDefinition(target.namedType.name.value);
  if (!targetDefinition || !isNodeSource(targetDefinition)) {
    return {
      isReverse: false,
    };
  }

  const node = cache.getDefinitionByField(field)!;

  const a = node.name.value;
  const b = normalizeTypeNode(field.type).namedType.name.value;

  return a.localeCompare(b) <= 0
    ? { edgeId: `${a}>${b}`, isReverse: false, sourceId: a, targetId: b }
    : { edgeId: `${b}>${a}`, isReverse: true, sourceId: b, targetId: a };
}

function buildArgId(
  typeNode:
    | InputObjectTypeDefinitionNode
    | InputObjectTypeExtensionNode
    | InterfaceTypeDefinitionNode
    | InterfaceTypeExtensionNode
    | ObjectTypeDefinitionNode
    | ObjectTypeExtensionNode,
  fieldNode: FieldDefinitionNode,
  inputValueNode: InputValueDefinitionNode,
): string {
  return `${typeNode.name.value}.${fieldNode.name.value}(${inputValueNode.name.value})`;
}

function buildEnumId(node: EnumTypeDefinitionNode): string {
  return node.name.value;
}

function buildEnumValueId(
  enumNode: EnumTypeDefinitionNode,
  enumValueNode: EnumValueDefinitionNode,
): string {
  return `${enumNode.name.value}.${enumValueNode.name.value}`;
}

function toLegacyTypeKind(
  typeKind: DefinitionNode['kind'] | undefined,
): SpecificFieldType['kind'] | undefined {
  if (!typeKind) return 'SCALAR';
  switch (typeKind) {
    case 'ObjectTypeDefinition':
      return 'OBJECT';
    case 'InterfaceTypeDefinition':
      return 'INTERFACE';
    case 'UnionTypeDefinition':
      return 'UNION';
    case 'EnumTypeDefinition':
      return 'ENUM';
    case 'ScalarTypeDefinition':
      return 'SCALAR';
    default:
      return undefined;
  }
}

function toLegacyInputTypeKind(
  typeKind: DefinitionNode['kind'] | undefined,
): SpecificInputFieldType['kind'] | undefined {
  if (!typeKind) return 'SCALAR';
  switch (typeKind) {
    case 'InputObjectTypeDefinition':
      return 'INPUT_OBJECT';
    case 'EnumTypeDefinition':
      return 'ENUM';
    case 'ScalarTypeDefinition':
      return 'SCALAR';
    default:
      return undefined;
  }
}

// ///////////////////////////////////////////////////////////////////////////

function isNodeSource(
  node: DefinitionNode | undefined,
): node is ObjectTypeDefinitionNode | InterfaceTypeDefinitionNode {
  return (
    !!node &&
    (node.kind === 'ObjectTypeDefinition' ||
      node.kind === 'InterfaceTypeDefinition')
  );
}

function isEnumSource(
  node: DefinitionNode | undefined,
): node is EnumTypeDefinitionNode {
  return !!node && node.kind === 'EnumTypeDefinition';
}

export type NormalizedTypeNode = {
  namedType: NamedTypeNode;
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
};

const normalizeFieldTypesByTypeNode = new WeakMap<
  TypeNode,
  NormalizedTypeNode
>();

export function normalizeTypeNode(typeNode: TypeNode): NormalizedTypeNode {
  if (!normalizeFieldTypesByTypeNode.has(typeNode)) {
    let type: TypeNode = typeNode;
    const isNotNull = type.kind === 'NonNullType';
    let isList = false;
    let isListElementNotNull: boolean | undefined = undefined;
    if (type.kind === 'NonNullType') {
      type = type.type;
    }
    if (type.kind === 'ListType') {
      isList = true;
      type = type.type;
      isListElementNotNull = type.kind === 'NonNullType';
      if (type.kind === 'NonNullType') {
        type = type.type;
      }
    }

    if (type.kind === 'ListType') throw new Error('Invalid use of ListType');

    normalizeFieldTypesByTypeNode.set(
      typeNode,
      typeof isListElementNotNull === 'boolean'
        ? {
            namedType: type,
            isNotNull,
            isList,
            isListElementNotNull,
          }
        : {
            namedType: type,
            isNotNull,
            isList,
          },
    );
  }
  return normalizeFieldTypesByTypeNode.get(typeNode)!;
}

const namedDefinitionByNameByDocument = new WeakMap<
  DocumentNode,
  Map<
    string,
    Exclude<DefinitionNode, SchemaDefinitionNode | SchemaExtensionNode>
  >
>();

export function getTypeDefinition(
  document: DocumentNode,
  namedType: NamedTypeNode,
):
  | Exclude<DefinitionNode, SchemaDefinitionNode | SchemaExtensionNode>
  | undefined {
  if (!namedDefinitionByNameByDocument.has(document)) {
    namedDefinitionByNameByDocument.set(document, new Map());
    const map = namedDefinitionByNameByDocument.get(document)!;
    for (const definition of document.definitions) {
      switch (definition.kind) {
        case 'SchemaDefinition':
        case 'SchemaExtension':
          // These definition kinds don't have names
          break;
        default:
          if (definition.name?.value) {
            map.set(definition.name.value, definition);
          }
      }
    }
  }
  return namedDefinitionByNameByDocument
    .get(document)
    ?.get(namedType.name.value);
}

function compact<T extends Object>(obj: T): T {
  const compacted: T = {} as any;

  for (const key of Object.keys(obj)) {
    if (typeof obj[key] !== 'undefined') {
      compacted[key] = obj[key];
    }
  }

  return compacted;
}
