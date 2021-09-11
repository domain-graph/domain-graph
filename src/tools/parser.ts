import * as graphql from 'graphql';

export type ParseError = {
  message: string;
};

export function getIntrospection(
  source: string,
): {
  introspection: graphql.IntrospectionQuery | null;
  errors: readonly ParseError[];
} {
  let introspection: graphql.IntrospectionQuery | null = null;
  const errors: ParseError[] = [];

  const obj = parseJson(source);

  if (obj) {
    // From JSON
    const specificErrors = getMoreSpecificErrors(obj);

    if (specificErrors.length) {
      specificErrors.forEach((e) => errors.push(e));
    } else {
      try {
        const schema = graphql.buildClientSchema(obj);
        introspection = graphql.introspectionFromSchema(schema);
      } catch (ex) {
        errors.push({
          message: ex.message,
        });
      }
    }
  } else {
    // From SDL
    try {
      introspection = parseWithFederationSpecFallback(source);
    } catch (ex) {
      if (ex instanceof graphql.GraphQLError) {
        errors.push({
          message: `${ex.message} ${ex.locations
            ?.map((x) => `[${x.line}, ${x.column}]`)
            .join(', ')}`,
        });
      } else {
        errors.push({
          message: ex.message || 'Unspecified error parsing the source input',
        });
      }
    }
  }

  return {
    introspection,
    errors,
  };
}

function getMoreSpecificErrors(json: any): ParseError[] {
  const errors: ParseError[] = [];

  if (typeof json.__schema === 'object') {
    for (const prop of [
      'queryType',
      'mutationType',
      'subscriptionType',
      'types',
      'directives',
    ]) {
      if (typeof json.__schema[prop] === 'undefined') {
        errors.push({
          message: `Source JSON is missing property "__schema.${prop}"`,
        });
      }
    }
  } else {
    errors.push({ message: 'Source JSON is missing property "__schema"' });
  }

  return errors;
}

function parseWithFederationSpecFallback(source: string) {
  // see: https://www.apollographql.com/docs/federation/federation-spec/
  const federationSchema = `
    scalar _FieldSet
    directive @external on FIELD_DEFINITION
    directive @requires(fields: _FieldSet!) on FIELD_DEFINITION
    directive @provides(fields: _FieldSet!) on FIELD_DEFINITION
    directive @key(fields: _FieldSet!) on OBJECT | INTERFACE
    directive @extends on OBJECT | INTERFACE
    `;

  try {
    const schema = graphql.buildSchema(source);
    return graphql.introspectionFromSchema(schema);
  } catch {
    const schema = graphql.buildSchema(source + federationSchema);
    return graphql.introspectionFromSchema(schema);
  }
}

function parseJson(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
