import {
  array,
  define,
  key,
  required,
  optional,
} from 'flux-standard-functions';

export type Input = {
  id: string;
  description?: string;
  inputFieldIds: string[];
};

export const inputDef = define<Input>({
  id: key(),
  description: optional(),
  inputFieldIds: required(array()),
});
