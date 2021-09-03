import {
  array,
  define,
  key,
  required,
  optional,
} from 'flux-standard-functions';

export type Enum = {
  id: string;
  description?: string;
  valueIds: string[];
};

export const enumDef = define<Enum>({
  id: key(),
  description: optional(),
  valueIds: required(array()),
});
