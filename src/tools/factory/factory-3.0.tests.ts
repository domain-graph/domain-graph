import { parse } from 'graphql';
import {
  buildArgs,
  buildEdges,
  buildEnums,
  buildEnumValues,
  buildFields,
  buildInputFields,
  buildInputs,
  buildNodes,
  factory,
} from './factory-3.0';

describe('factory 3.0', () => {
  describe(factory, () => {
    it('works', () => {
      // ARRANGE
      const document = parse(`
        """
        The query node
        """
        type Query {
          x: ComplexType
        }
      
        type ComplexType {
          id: ID!
          value: String
        }
        
        enum EnumA {
          FOO
          BAR
        }
        
        input ReviewInput {
          stars: Int!
          commentary: String
        }`);

      // ACT
      const result = factory(document);

      // ASSERT
      // console.log(result);
    });
  });

  describe(buildNodes, () => {
    it('builds nodes', () => {
      // ARRANGE
      const document = parse(`
        """
        The query node
        """
        type Query {
          x: ComplexType
        }
      
        type ComplexType {
          id: ID!
          value: String
        }
        
        enum EnumA {
          FOO
          BAR
        }
        
        input ReviewInput {
          stars: Int!
          commentary: String
        }`);

      // ACT
      const result = buildNodes(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'Query',
          edgeIds: ['ComplexType>Query'],
          fieldIds: ['Query.x'],
          description: 'The query node',
        },
        {
          id: 'ComplexType',
          edgeIds: ['ComplexType>Query'],
          fieldIds: ['ComplexType.id', 'ComplexType.value'],
        },
      ]);
    });
  });

  describe(buildFields, () => {
    it('builds fields with scalar types', () => {
      const document = parse(`
        type TypeA {
          foo: String
        }`);

      // ACT
      const result = buildFields(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'TypeA.foo',
          name: 'foo',
          isList: false,
          isNotNull: false,
          nodeId: 'TypeA',
          typeKind: 'SCALAR',
          typeName: 'String',
          isReverse: false,
          argIds: [],
        },
      ]);
    });

    it('builds fields with non-scalar types', () => {
      // ARRANGE
      const document = parse(`
        type TypeA {
          nullArray: [TypeB]
          nullCompactArray: [TypeB!]
          compactArray: [TypeB]!
          array: [TypeB!]!
        }

        type TypeB {
          nullComplex: TypeA
          complex: TypeA!
        }`);

      // ACT
      const result = buildFields(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'TypeA.nullArray',
          name: 'nullArray',
          edgeId: 'TypeA>TypeB',
          isList: true,
          isNotNull: false,
          isListElementNotNull: false,
          nodeId: 'TypeA',
          typeKind: 'OBJECT',
          typeName: 'TypeB',
          isReverse: false,
          argIds: [],
        },
        {
          id: 'TypeA.nullCompactArray',
          name: 'nullCompactArray',
          edgeId: 'TypeA>TypeB',
          isList: true,
          isNotNull: false,
          isListElementNotNull: true,
          nodeId: 'TypeA',
          typeKind: 'OBJECT',
          typeName: 'TypeB',
          isReverse: false,
          argIds: [],
        },
        {
          id: 'TypeA.compactArray',
          name: 'compactArray',
          edgeId: 'TypeA>TypeB',
          isList: true,
          isNotNull: true,
          isListElementNotNull: false,
          nodeId: 'TypeA',
          typeKind: 'OBJECT',
          typeName: 'TypeB',
          isReverse: false,
          argIds: [],
        },
        {
          id: 'TypeA.array',
          name: 'array',
          edgeId: 'TypeA>TypeB',
          isList: true,
          isNotNull: true,
          isListElementNotNull: true,
          nodeId: 'TypeA',
          typeKind: 'OBJECT',
          typeName: 'TypeB',
          isReverse: false,
          argIds: [],
        },
        {
          id: 'TypeB.nullComplex',
          name: 'nullComplex',
          edgeId: 'TypeA>TypeB',
          isList: false,
          isNotNull: false,
          nodeId: 'TypeB',
          typeKind: 'OBJECT',
          typeName: 'TypeA',
          isReverse: true,
          argIds: [],
        },
        {
          id: 'TypeB.complex',
          name: 'complex',
          edgeId: 'TypeA>TypeB',
          isList: false,
          isNotNull: true,
          nodeId: 'TypeB',
          typeKind: 'OBJECT',
          typeName: 'TypeA',
          isReverse: true,
          argIds: [],
        },
      ]);
    });
  });

  describe(buildEdges, () => {
    it('builds edges', () => {
      // ARRANGE
      const document = parse(`
        type TypeA {
          id: ID!
          nullArray: [TypeB]
          nullCompactArray: [TypeB!]
          compactArray: [TypeB]!
          array: [TypeB!]!
        }
        
        type TypeB {
          id: ID!
          nullComplex: TypeA
          complex: TypeA!
        }`);

      // ACT
      const result = buildEdges(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'TypeA>TypeB',
          sourceNodeId: 'TypeA',
          targetNodeId: 'TypeB',
          fieldIds: [
            'TypeA.nullArray',
            'TypeA.nullCompactArray',
            'TypeA.compactArray',
            'TypeA.array',
            'TypeB.nullComplex',
            'TypeB.complex',
          ],
        },
      ]);
    });
  });

  describe(buildArgs, () => {
    it('builds args', () => {
      // ARRANGE
      const document = parse(`
        type TypeA {
          id: ID!
          child(
            nullArray: [String]
            nullCompactArray: [String!]
            compactArray: [String]!
            array: [String!]!
          ): TypeB
        }
        
        type TypeB {
          id: ID!
          nullComplex: TypeA
          complex: TypeA!
        }`);

      // ACT
      const result = buildArgs(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'TypeA.child(nullArray)',
          fieldId: 'TypeA.child',
          name: 'nullArray',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: true,
          isNotNull: false,
          isListElementNotNull: false,
        },
        {
          id: 'TypeA.child(nullCompactArray)',
          fieldId: 'TypeA.child',
          name: 'nullCompactArray',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: true,
          isNotNull: false,
          isListElementNotNull: true,
        },
        {
          id: 'TypeA.child(compactArray)',
          fieldId: 'TypeA.child',
          name: 'compactArray',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: true,
          isNotNull: true,
          isListElementNotNull: false,
        },
        {
          id: 'TypeA.child(array)',
          fieldId: 'TypeA.child',
          name: 'array',
          typeKind: 'SCALAR',
          typeName: 'String',
          isList: true,
          isNotNull: true,
          isListElementNotNull: true,
        },
      ]);
    });
  });

  describe(buildEnums, () => {
    it('builds enums', () => {
      // ARRANGE
      const document = parse(`
        enum EnumA {
          FOO
          """
          The value of bar
          """
          BAR
        }
        
        """
        The second enum
        """
        enum EnumB {
          FIZZ
          BUZZ
        }`);

      // ACT
      const result = buildEnums(document);

      // ASSERT
      expect(result).toStrictEqual([
        { id: 'EnumA', valueIds: ['EnumA.FOO', 'EnumA.BAR'] },
        {
          id: 'EnumB',
          description: 'The second enum',
          valueIds: ['EnumB.FIZZ', 'EnumB.BUZZ'],
        },
      ]);
    });
  });

  describe(buildEnumValues, () => {
    it('builds enums', () => {
      // ARRANGE
      const document = parse(`
        enum EnumA {
          FOO
          """
          The value of bar
          """
          BAR
        }
        
        """
        The second enum
        """
        enum EnumB {
          FIZZ
          BUZZ
        }`);

      // ACT
      const result = buildEnumValues(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'EnumA.FOO',
          enumId: 'EnumA',
          name: 'FOO',
          isDeprecated: false,
        },
        {
          id: 'EnumA.BAR',
          enumId: 'EnumA',
          description: 'The value of bar',
          name: 'BAR',
          isDeprecated: false,
        },
        {
          id: 'EnumB.FIZZ',
          enumId: 'EnumB',
          name: 'FIZZ',
          isDeprecated: false,
        },
        {
          id: 'EnumB.BUZZ',
          enumId: 'EnumB',
          name: 'BUZZ',
          isDeprecated: false,
        },
      ]);
    });
  });

  describe(buildInputs, () => {
    it('builds inputs', () => {
      // ARRANGE
      const document = parse(`
        """
        The query node
        """
        type Query {
          x: ComplexType
        }
      
        type ComplexType {
          id: ID!
          value: String
        }
        
        enum EnumA {
          FOO
          BAR
        }
        
        input InputA {
          foo: Int!
          bar: String
          child: InputB!
        }
        
        """
        Description for InputB
        """
        input InputB {
          foo: Int!
          """
          Description for bar
          """
          bar: String
        }`);

      // ACT
      const result = buildInputs(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'InputA',
          inputFieldIds: ['InputA.foo', 'InputA.bar', 'InputA.child'],
        },
        {
          id: 'InputB',
          inputFieldIds: ['InputB.foo', 'InputB.bar'],
          description: 'Description for InputB',
        },
      ]);
    });
  });

  describe(buildInputFields, () => {
    it('builds inputs', () => {
      // ARRANGE
      const document = parse(`
        input InputA {
          foo: Int!
          bar: String
          child: InputB!
        }
        
        """
        Description for InputB
        """
        input InputB {
          foo: Int!
          """
          Description for bar
          """
          bar: String
        }`);

      // ACT
      const result = buildInputFields(document);

      // ASSERT
      expect(result).toStrictEqual([
        {
          id: 'InputA.foo',
          name: 'InputA',
          isList: false,
          isNotNull: true,
          inputId: 'InputA',
          typeKind: 'SCALAR',
          typeName: 'Int',
        },
        {
          id: 'InputA.bar',
          name: 'InputA',
          isList: false,
          isNotNull: false,
          inputId: 'InputA',
          typeKind: 'SCALAR',
          typeName: 'String',
        },
        {
          id: 'InputA.child',
          name: 'InputA',
          isList: false,
          isNotNull: true,
          inputId: 'InputA',
          typeKind: 'INPUT_OBJECT',
          typeName: 'InputB',
        },
        {
          id: 'InputB.foo',
          name: 'InputB',
          isList: false,
          isNotNull: true,
          inputId: 'InputB',
          typeKind: 'SCALAR',
          typeName: 'Int',
        },
        {
          id: 'InputB.bar',
          name: 'InputB',
          isList: false,
          isNotNull: false,
          inputId: 'InputB',
          typeKind: 'SCALAR',
          typeName: 'String',
          description: 'Description for bar',
        },
      ]);
    });
  });
});
