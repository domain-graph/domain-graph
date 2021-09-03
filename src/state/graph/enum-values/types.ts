import {
  define,
  key,
  required,
  optional,
} from 'flux-standard-functions';

export type EnumValue = {
  id: string;
  enumId: string;
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
};

export const enumValueDef = define<EnumValue>({
  id: key(),
  enumId: required(),
  name: required(),
  description: optional(),
  isDeprecated: required(),
  deprecationReason: optional(),
});
