import {
  DefinitionNode,
  DocumentNode,
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

export type NormalizedTypeNode = {
  namedType: NamedTypeNode;
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
};

export class DocumentCache {
  constructor(readonly document: DocumentNode) {
    for (const definition of document.definitions) {
      if (hasName(definition) && definition.name?.value) {
        this.namedDefinitionByName.set(definition.name.value, definition);
      }

      if (hasFields(definition)) {
        for (const field of definition.fields || []) {
          switch (field.kind) {
            case 'FieldDefinition':
              this.definitionsByField.set(field, definition);

              // TODO index args
              for (const arg of field.arguments || []) {
                this.definitionsByInputValue.set(arg, field);
              }
              break;

            case 'InputValueDefinition':
              this.definitionsByInputValue.set(field, definition);
              break;
          }
        }
      }
    }
  }

  private readonly definitionsByInputValue = new Map<
    InputValueDefinitionNode,
    | FieldDefinitionNode
    | InputValueDefinitionNode
    | InputObjectTypeDefinitionNode
    | InputObjectTypeExtensionNode
    | InterfaceTypeDefinitionNode
    | InterfaceTypeExtensionNode
    | ObjectTypeDefinitionNode
    | ObjectTypeExtensionNode
  >();

  private readonly definitionsByField = new Map<
    FieldDefinitionNode,
    | InputObjectTypeDefinitionNode
    | InputObjectTypeExtensionNode
    | InterfaceTypeDefinitionNode
    | InterfaceTypeExtensionNode
    | ObjectTypeDefinitionNode
    | ObjectTypeExtensionNode
  >();

  private readonly namedDefinitionByName = new Map<
    string,
    Exclude<DefinitionNode, SchemaDefinitionNode | SchemaExtensionNode>
  >();

  private readonly normalizeFieldTypesByTypeNode = new WeakMap<
    TypeNode,
    NormalizedTypeNode
  >();

  normalizeTypeNode(typeNode: TypeNode): NormalizedTypeNode {
    if (!this.normalizeFieldTypesByTypeNode.has(typeNode)) {
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

      let normalizeTypeNode: NormalizedTypeNode;

      if (type.kind === 'ListType') {
        // TODO: Support nested lists #84
        normalizeTypeNode = {
          isList: true,
          isNotNull,
          namedType: {
            kind: 'NamedType',
            name: { kind: 'Name', value: 'UnsupportedNestedList' },
          },
          isListElementNotNull,
        };
      } else if (typeof isListElementNotNull === 'boolean') {
        normalizeTypeNode = {
          namedType: type,
          isNotNull,
          isList,
          isListElementNotNull,
        };
      } else {
        normalizeTypeNode = {
          namedType: type,
          isNotNull,
          isList,
        };
      }

      this.normalizeFieldTypesByTypeNode.set(typeNode, normalizeTypeNode);
    }
    return this.normalizeFieldTypesByTypeNode.get(typeNode)!;
  }

  getTypeDefinition(
    name: string,
  ):
    | Exclude<DefinitionNode, SchemaDefinitionNode | SchemaExtensionNode>
    | undefined {
    return this.namedDefinitionByName.get(name);
  }

  getDefinitionByField(node: FieldDefinitionNode) {
    return this.definitionsByField.get(node);
  }

  getDefinitionByInputValue(node: InputValueDefinitionNode) {
    return this.definitionsByInputValue.get(node);
  }

  *nodes() {
    for (const definition of this.document.definitions) {
      if (
        definition.kind === 'ObjectTypeDefinition' ||
        definition.kind === 'InterfaceTypeDefinition'
      ) {
        yield definition;
      }
    }
  }

  *fields() {
    for (const node of this.nodes()) {
      for (const field of node.fields || []) {
        yield field;
      }
    }
  }

  *args() {
    for (const field of this.fields()) {
      for (const arg of field.arguments || []) {
        yield arg;
      }
    }
  }

  *inputs() {
    for (const definition of this.document.definitions) {
      if (definition.kind === 'InputObjectTypeDefinition') {
        yield definition;
      }
    }
  }
}

function hasName(
  node: DefinitionNode,
): node is Exclude<DefinitionNode, SchemaDefinitionNode | SchemaExtensionNode> {
  switch (node.kind) {
    case 'SchemaDefinition':
    case 'SchemaExtension':
      return false;
    default:
      return true;
  }
}

function hasFields(
  node: DefinitionNode,
): node is
  | InputObjectTypeDefinitionNode
  | InputObjectTypeExtensionNode
  | InterfaceTypeDefinitionNode
  | InterfaceTypeExtensionNode
  | ObjectTypeDefinitionNode
  | ObjectTypeExtensionNode {
  switch (node.kind) {
    case 'InputObjectTypeDefinition':
    case 'InputObjectTypeExtension':
    case 'InterfaceTypeDefinition':
    case 'InterfaceTypeExtension':
    case 'ObjectTypeDefinition':
    case 'ObjectTypeExtension':
      return true;
    default:
      return false;
  }
}
