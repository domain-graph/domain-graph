[![master](https://github.com/{ORG_NAME}/{REPO_NAME}/workflows/build/badge.svg?branch=master&amp;event=push)](https://github.com/{ORG_NAME}/{REPO_NAME}/actions?query=workflow%3Abuild+branch%3Amaster+event%3Apush)

# domain-graph

Blank web application built with Typescript and LESS

## How To:

### Bundle Typescript and LESS files

The `build` script uses Webpack to perform the transpilation and bundling steps:

1. `npm run build`

Typescript files will be transpiled and bundled in `main.[hash].js`, LESS files imported by .ts files will be bundled in `main.[hash].css`, and both of those files will be reference by `index.html`. (The build output can be found in `./dist`)

To build for production, set the `NODE_ENV` environment variable to `production`:

1. `NODE_ENV=production npm run build`

### Run the Dev Server with Hot Module Reloading (HMR)

To run the server:

1. `npm start`
1. Open `localhost:9000` in your browser

Any changes to `index.html`, `*.ts`, or `*.less` files will be immediately reflected in the browser without required a page refresh.

### Run unit tests

The `test` script will run any file ending with `.tests.ts`:

1. `npm test`

Code coverage may be viewed in `./coverage/lcov-report/index.html`.

### Add code or style files

#### Code

The entry point of the Typescript files is `./src/index.ts`; therefore, any file that will be included in the `.js` bundle must be ultimately imported from `index.ts`.

#### Styles

`*.less` files must be imported from Typescript in order to be included in the `.css` bundle. Note that even though the styles are "imported" into a code file, they are NOT inlined into the `.js` bundle. The `MiniCssExtractPlugin` ensures that any LESS styles imported into code are moved from the code into the style bundle. (The `less.d.ts` file prevents compile-time errors when importing non-Typescript content.)

Example:

```ts
import './index.less';

const code = 'goes here';
```

#### Markup

Add your markup to `./src/index.html`. This file is used as the "template" when running Webpack. The resulting file will include script and link tags to the `.js` and `.css` bundles.

---

Generated with [generator-ts-website](https://www.npmjs.com/package/generator-ts-website)
