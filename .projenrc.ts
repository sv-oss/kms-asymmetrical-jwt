import { typescript } from 'projen';
import { NodePackageManager } from 'projen/lib/javascript';

const project = new typescript.TypeScriptAppProject({
  name: '@sv-oss/kms-asymmetrical-jwt',
  description: 'A signing/verifying wrapper for jsonwebtoken integrated directly with KMS',
  repository: 'https://github.com/sv-oss/kms-asymmetrical-jwt',
  authorName: 'Service Victoria',
  authorEmail: 'platform@service.vic.gov.au',
  license: 'MIT',
  package: true,
  release: true,
  releaseToNpm: true,
  npmRegistryUrl: 'https://npm.pkg.github.com/',
  defaultReleaseBranch: 'master',
  packageManager: NodePackageManager.NPM,
  jest: true,
  majorVersion: 1,
  projenrcTs: true,
  deps: [
    'jsonwebtoken',
    'base64url',
    'prettier',
    'ms',
  ],
  devDeps: [
    '@types/jsonwebtoken',
    '@aws-sdk/client-kms',
    '@types/ms',
  ],
  gitignore: ['.env'],
  homepage: 'https://github.com/sv-oss/kms-asymmetrical-jwt',
  githubOptions: {
    mergify: false,
    pullRequestLintOptions: {
      semanticTitleOptions: {
        types: [
          'feat',
          'fix',
          'chore',
          'build',
          'docs',
          'refactor',
          'test',
          'ci',
        ],
      },
    },
  },
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
function addTsOverride(path: string, value: any) {
  project.tsconfig!.file.addOverride(path, value);
  project.tsconfigEslint!.file.addOverride(path, value);
  project.tryFindObjectFile('tsconfig.dev.json')!.addOverride(path, value);
}