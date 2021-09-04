import { define, key, required, optional } from 'flux-standard-functions';
import { SpecificInputFieldType } from '../../../tools/types';

export type InputField = {
  id: string;
  inputId: string;
  name: string;
  description?: string;
  defaultValue?: string;
  typeKind: SpecificInputFieldType['kind'];
  typeName: SpecificInputFieldType['name'];
  isNotNull: boolean;
  isList: boolean;
  isListElementNotNull?: boolean;
};

export const inputFieldDef = define<InputField>({
  id: key(),
  inputId: required(),
  name: required(),
  description: optional(),
  defaultValue: optional(),
  typeKind: required(),
  typeName: required(),
  isNotNull: required(),
  isList: required(),
  isListElementNotNull: optional(),
});