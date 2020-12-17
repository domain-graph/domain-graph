export type Schema = {
  data: {
    __schema: {
      queryType: { name: string };
      mutationType: { name: string };
      subscriptionType: { name: string };
      types: SchemaType[];
    };
  };
};

export interface Named {
  name: string;
  description: string | null;
}

export interface Deprecable {
  isDeprecated: boolean;
  deprecationReason: string | null;
}

export type SchemaType =
  | ObjectType
  | ScalarType
  | EnumType
  | InputObjectType
  | InterfaceType
  | UnionType;

export interface ObjectType extends Named {
  kind: 'OBJECT';
  fields: Field[];
  interfaces: InterfaceFieldType[];
}

export function isObjectType(
  type: SchemaType | undefined | null,
): type is ObjectType {
  return type?.kind === 'OBJECT';
}

export interface ScalarType extends Named {
  kind: 'SCALAR';
}

export function isScalarType(
  type: SchemaType | undefined | null,
): type is ScalarType {
  return type?.kind === 'SCALAR';
}

export interface EnumType extends Named {
  kind: 'ENUM';
  enumValues: EnumValue[];
}

export interface EnumValue extends Named, Deprecable {}

export function isEnumType(
  type: SchemaType | undefined | null,
): type is EnumType {
  return type?.kind === 'ENUM';
}

export interface InputObjectType extends Named {
  kind: 'INPUT_OBJECT';
  inputFields: InputValue[];
}

export interface InputField extends Named {
  type: FieldType;
  defaultValue: string | null;
}

export function isInputObjectType(
  type: SchemaType | undefined | null,
): type is InputObjectType {
  return type?.kind === 'INPUT_OBJECT';
}

export interface InterfaceType extends Named {
  kind: 'INTERFACE';
  fields: Field[];
  possibleTypes: ObjectFieldType[];
}

export function isInterfaceType(
  type: SchemaType | undefined | null,
): type is InterfaceType {
  return type?.kind === 'INTERFACE';
}

export interface UnionType extends Named {
  kind: 'UNION';
  possibleTypes: ObjectFieldType[];
}

export function isUnionType(
  type: SchemaType | undefined | null,
): type is UnionType {
  return type?.kind === 'UNION';
}

export type FieldType = WrappedFieldType | SpecificFieldType;

export type WrappedFieldType = NonNullFieldType | ListFieldType;

export function isWrappedFieldType(
  type: FieldType | undefined | null,
): type is WrappedFieldType {
  return isNonNullFieldType(type) || isListFieldType(type);
}

export interface NonNullFieldType {
  kind: 'NON_NULL';
  ofType: SpecificFieldType;
}

export function isNonNullFieldType(
  type: FieldType | undefined | null,
): type is NonNullFieldType {
  return type?.kind === 'NON_NULL';
}

export interface ListFieldType {
  kind: 'LIST';
  ofType: SpecificFieldType | NonNullFieldType;
}

export function isListFieldType(
  type: FieldType | undefined | null,
): type is ListFieldType {
  return type?.kind === 'LIST';
}

export type SpecificFieldType =
  | ObjectFieldType
  | ScalarFieldType
  | EnumFieldType
  | UnionFieldType
  | InterfaceFieldType;

export interface ObjectFieldType {
  kind: 'OBJECT';
  name: string;
}

export function isObjectFieldType(
  type: FieldType | undefined | null,
): type is ObjectFieldType {
  return type?.kind === 'OBJECT';
}

export interface ScalarFieldType {
  kind: 'SCALAR';
  name: string;
}

export function isScalarFieldType(
  type: FieldType | undefined | null,
): type is ScalarFieldType {
  return type?.kind === 'SCALAR';
}

export interface EnumFieldType {
  kind: 'ENUM';
  name: string;
}

export function isEnumFieldType(
  type: FieldType | undefined | null,
): type is EnumFieldType {
  return type?.kind === 'ENUM';
}

export interface UnionFieldType {
  kind: 'UNION';
  name: string;
}

export function isUnionFieldType(
  type: FieldType | undefined | null,
): type is UnionFieldType {
  return type?.kind === 'UNION';
}

export interface InterfaceFieldType {
  kind: 'INTERFACE';
  name: string;
}

export function isInterfaceFieldType(
  type: FieldType | undefined | null,
): type is InterfaceFieldType {
  return type?.kind === 'INTERFACE';
}

export interface Field extends Named, Deprecable {
  args: InputValue[];
  type: FieldType;
}

export interface InputValue extends Named {
  type: FieldType;
  defaultValue: string;
}
