export type KeysOfType<Base, Condition> = {
  [Key in keyof Base]: Base[Key] extends Condition ? Key : never;
}[keyof Base];

export type OmitByType<Base, Condition> = Omit<
  Base,
  KeysOfType<Base, Condition>
>;

export type PickByType<Base, Condition> = Pick<
  Base,
  KeysOfType<Base, Condition>
>;
