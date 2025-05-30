# Adding Support for a New ES|QL Command in Kibana

## Overview

Integrating a new ES|QL command into Kibana’s editor requires you to modify the codebase in several places. This guide aims to gather all the required changes in one place. For detailed explanations of the inner workings of each package, you will be linked to its README.

Seamlessly integrating a new command involves:

- [ ] Supporting a new node in the ES|QL abstract syntax tree (AST)
- [ ] Validating that the command works well when prettifying the query
- [ ] Supporting the new command in the syntax highlighting libraries
- [ ] Creating the command definition
- [ ] Adding the corresponding client-side validations
- [ ] Adding the autocomplete suggestions

## Supporting a new node in the ES|QL AST

We use a custom AST as a helper to support the rest of the capabilities listed in this document. Therefore, the first step is to create a new node in the tree when parsing the new command.

- [ ] Make sure that the new command is in the local Kibana grammar definition. The ANTLR lexer and parser files are updated every Monday from the source definition of the language at Elasticsearch (via a manually merged, automatically generated [PR](https://github.com/elastic/kibana/pull/213006)).
- [ ] Create a factory for generating the new node. The new node should satisfy the `ESQLCommand<Name>` interface. If the syntax of your command cannot be decomposed only in parameters, you can hold extra information by extending the `ESQLCommand` interface. I.E., check the Rerank command.
- [ ] While ANTLR is parsing the text query, we create our own AST by using `onExit` listeners at `kbn-esql-ast/src/parser/esql_ast_builder_listener.ts`. Implement the `onExit<COMMAND_NAME>` method based on the interface autogenerated by ANTLR and push the new node into the AST.
- [ ] Create unit tests checking that the correct AST nodes are generated when parsing your command.
- [ ] Add a dedicated [visitor callback](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-ast/src/visitor/README.md) for the new command.
- [ ] Verify that the `Walker` API can visit the new node.
- [ ] Verify that the `Synth` API can construct the new node.  

### Example PR’s ⭐

[FORK command](https://github.com/elastic/kibana/pull/216743).

## Validating that the command works well when prettifying the query

[Pretty-printing](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-ast/src/pretty_print/README.md) is the process of converting an ES|QL AST into a human-readable string. This is useful for debugging or for displaying the AST to the user.

Depending on the command you are adding, it may be required or not to do an adjustment.

- [ ] Validate that the prettifier works correctly.
- [ ] Adjust the basic pretty printer and the wrapping pretty printer if needed.
- [ ] Add unit tests validating that the queries are correctly formatted (even if no adjustment has been done).

### Example PR’s ⭐

[FORK command](https://github.com/elastic/kibana/pull/216743/files#diff-b4a14d3c1f4ce04db1f706548871db4d89fc99666d9c179b1b9e4af52069172b).

## Supporting the new command in the syntax highlighting libraries

Currently, we support 3 highlighting libraries: Monaco, HighlightJS, and PrismJS. We should update them when adding new commands.

- [ ] Add command to [prismjs-esql](https://github.com/elastic/prismjs-esql) | [npm](https://www.npmjs.com/package/@elastic/prismjs-esql)
  - [ ] [Release](https://github.com/elastic/eui) a new version
- [ ] Add command to [monaco-esql](https://github.com/elastic/monaco-esql) | [npm](https://www.npmjs.com/package/@elastic/monaco-esql)
  - [ ] [Release](https://github.com/elastic/monaco-esql?tab=readme-ov-file#releasing) a new version
- [ ] Add command to [highlightjs-esql](https://github.com/elastic/highlightjs-esql) | [npm](https://www.npmjs.com/package/@elastic/highlightjs-esql)
  - [ ] [Release](https://github.com/elastic/monaco-esql?tab=readme-ov-file#releasing) a new version
- [ ] Update [EUI’s](https://github.com/elastic/eui) prismjs-esql version
  - [ ] `yarn upgrade @elastic/prismjs-esql@<version>`
- [ ] Update Kibana monaco-esql version
  - [ ] `yarn upgrade @elastic/monaco-esql@<version>`

### Example PR’s ⭐

[Prismjs-esql](https://github.com/elastic/prismjs-esql/pull/3)

[Monaco-esql](https://github.com/elastic/monaco-esql/pull/4)

[Highlightjs-esql](https://github.com/elastic/highlightjs-esql/pull/4)

[update eui](https://github.com/elastic/eui/pull/8587)

[update Kibana](https://github.com/elastic/kibana/pull/220378)

## Creating the command definition

We need to register the new command in the `kbn-esql-validation-autocomplete` [package](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-validation-autocomplete/README.md) in order to activate the autocomplete and validation features.

- [ ] Add the definition of the new command at `kbn-esql-validation-autocomplete/src/definitions/commands.ts`.

    If the command is not ready to be advertised, use `hidden: true`.
    
    If the command is available in a technical preview, use `preview: true`.
    
    If the command is ready for GA, don’t use either of the above properties.

## Adding the corresponding client-side validations

By default, every new command will pass through a set of validations, such as checking the number of parameters in a function or if an unknown column has been used.

If your command needs a custom validation to be implemented, you can attach it in the `validate` field of the previously created command definition. This will not prevent the default validations from running.

If you want to prevent the default validation, you will need to modify the `validateCommand` method and prevent the default branch of the switch. Take the `JOIN` command as an example.

- [ ] Add a custom validation if needed.
- [ ] Add tests checking the behavior of the validation following this [guide](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-validation-autocomplete/README.md#the-new-way).

### Example ⭐

Here it’s checked that the fork command is invoked with at least 2 parameters (branches).

```ts
{
    hidden: true,
    name: 'fork',
    preview: true,
    description: i18n.translate('kbn-esql-validation-autocomplete.esql.definitions.forkDoc', {
      defaultMessage: 'Forks the stream.',
    }),
    declaration: `TODO`,
    examples: [],
    suggest: suggestForFork,
    validate: (command) => {
      const messages: ESQLMessage[] = [];

      if (command.args.length < 2) {
        messages.push({
          location: command.location,
          text: i18n.translate(
            'kbn-esql-validation-autocomplete.esql.validation.forkTooFewBranches',
            {
              defaultMessage: '[FORK] Must include at least two branches.',
            }
          ),
          type: 'error',
          code: 'forkTooFewBranches',
        });
      }

      return messages;
    },
  }
```

## Adding the autocomplete suggestions

Define what are the keywords you want to be suggested when the cursor is positioned at the new command.

You can read how suggestions work [here](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-validation-autocomplete/README.md#autocomplete-1).

- [ ] Add the suggestions to be shown when **positioned at** the new command.
  - [ ] Create a new folder at `kbn-esql-validation-autocomplete/src/autocomplete/commands` for your command.
  - [ ] Export a `suggest` function that should return an array of suggestions and set it up into the command definition.
    <br/><br/>
    **Example** ⭐ of suggestions for the WHERE command:

    ```ts
    export async function suggest(
      params: CommandSuggestParams<'where'>
    ): Promise<SuggestionRawDefinition[]> {
      const expressionRoot = params.command.args[0] as ESQLSingleAstItem | undefined;
      const suggestions = await suggestForExpression({
        ...params,
        expressionRoot,
        location: Location.WHERE,
        preferredExpressionType: 'boolean',
      });
    
      const expressionType = params.getExpressionType(expressionRoot);
      if (expressionType === 'boolean' && isExpressionComplete(expressionType, params.innerText)) {
        suggestions.push(pipeCompleteItem);
      }
      return suggestions;
    }
    ```
  - [ ] Optionally, we must filter or incorporate fields suggestions after a command is executed, this is supported by adding the `fieldsSuggestionsAfter` method to the command definition. Read this documentation to understand how it works.
    <br><br/>
    **Example** ⭐ of `suggestionsAfter` for the DROP command, you can see how the dropped columns are excluded from future suggestions after the command execution:
    ```ts
    export const fieldsSuggestionsAfter = (
      command: ESQLAstCommand,
      previousCommandFields: ESQLFieldWithMetadata[],
      userDefinedColumns: ESQLFieldWithMetadata[]
    ) => {
      const columnsToDrop: string[] = [];
      
      walk(command, {
          visitColumn: (node) => {
          columnsToDrop.push(node.name);
        },
      });
      
      return previousCommandFields.filter((field) => {
        // if the field is not in the columnsToDrop, keep it
        return !columnsToDrop.some((column) => column === field.name);
      });
    };
    ```
  - [ ] If the new command must be suggested only in particular situations, modify the corresponding suggestions to make it possible.
  - [ ] Add tests following this [guide](https://github.com/elastic/kibana/blob/main/src/platform/packages/shared/kbn-esql-validation-autocomplete/README.md#automated-testing).

### Example PR’s ⭐
[Adding FORK command](https://github.com/elastic/kibana/pull/216743)

      