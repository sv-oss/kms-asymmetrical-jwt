const { TypeScriptAppProject, NpmAccess } = require('projen');

const project = new TypeScriptAppProject({
  name: '@sv-oss/kms-asymmetrical-jwt',
  description: 'A signing/verifying wrapper for jsonwebtoken integrated directly with KMS',
  repositoryUrl: 'https://github.com/sv-oss/kms-asymmetrical-jwt',
  authorName: 'Service Victoria',
  authorEmail: 'platform@service.vic.gov.au',
  license: 'MIT',
  package: true,
  release: true,
  releaseToNpm: true,
  npmAccess: NpmAccess.PUBLIC,
  defaultReleaseBranch: 'master',
  jest: true,
  deps: [
    'jsonwebtoken',
    'base64url',
    'prettier',
    'ms',
  ],
  devDeps: [
    'aws-sdk@^2.0.0',
    '@types/jsonwebtoken',
    '@types/ms',
  ],
  gitignore: ['.env'],
  homepage: 'https://github.com/sv-oss/kms-asymmetrical-jwt',
});

// add support for dom library in typescript compiler
addTsOverride('compilerOptions.lib', ['es2018', 'dom']);
addTsOverride('compilerOptions.esModuleInterop', true);
addTsOverride('compilerOptions.useUnknownInCatchVariables', false);

project.package.addField('main', 'lib/index.js');

project.synth();

/**
 * addTsOverride - Adds an override to all tsconfig files (base, eslint & test)
 * @param {string} path - The path to override
 * @param {*} value - The new overridden value
 */
function addTsOverride(path, value) {
  project.tsconfig.file.addOverride(path, value);
  project.tsconfigEslint.file.addOverride(path, value);
  project.tryFindObjectFile('tsconfig.dev.json').addOverride(path, value);
}