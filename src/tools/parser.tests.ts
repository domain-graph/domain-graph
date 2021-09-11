import { buildSchema, introspectionFromSchema } from 'graphql';
import { getIntrospection } from './parser';

describe('parser', () => {
  it('returns an introspection object from valid JSON input', () => {
    // ARRANGE
    const source = validJSON;

    // ACT
    const { introspection, errors } = getIntrospection(source);

    // ASSERT
    expect(introspection).toBeTruthy();
    expect(errors.length).toBe(0);
  });

  it('returns an introspection object from valid SDL input', () => {
    // ARRANGE
    const source = validSchema;

    // ACT
    const { introspection, errors } = getIntrospection(source);

    // ASSERT
    expect(introspection).toBeTruthy();
    expect(errors.length).toBe(0);
  });

  it('returns an error array from invalid JSON input', () => {
    // ARRANGE
    const source = JSON.stringify({ foo: 'bar' });

    // ACT
    const { introspection, errors } = getIntrospection(source);

    // ASSERT
    expect(introspection).toBeFalsy();
    expect(errors.length).toBeGreaterThan(0);
  });

  it('returns an error array from invalid SDL input', () => {
    // ARRANGE
    const source = 'type asdfkjhdjfh kjhsdf';

    // ACT
    const { introspection, errors } = getIntrospection(source);

    // ASSERT
    expect(introspection).toBeFalsy();
    expect(errors.length).toBeGreaterThan(0);
  });
});

const validSchema = `
  type Query {
    x: ComplexType
  }

  type ComplexType {
    id: ID!
    value: String
  }`;

const validJSON = JSON.stringify(
  introspectionFromSchema(buildSchema(validSchema)),
);
