import {
  define,
  key,
  required,
  optional,
  array,
} from 'flux-standard-functions';

export type EnumValue = {
  id: string;
  enumId: string;
  name: string;
  description?: string;
  isDeprecated: boolean;
  deprecationReason?: string;
  hideWith?: string[];
  showWith?: string[];
};

export const enumValueDef = define<EnumValue>({
  id: key(),
  enumId: required(),
  name: required(),
  description: optional(),
  isDeprecated: required(),
  deprecationReason: optional(),
  hideWith: optional(array()),
  showWith: optional(array()),
});
