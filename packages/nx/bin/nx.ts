#!/usr/bin/env node
import {
  findWorkspaceRoot,
  WorkspaceTypeAndRoot,
} from '../src/utils/find-workspace-root';
import * as chalk from 'chalk';
import { initLocal } from './init-local';
import { output } from '../src/utils/output';
import {
  getNxInstallationPath,
  getNxRequirePaths,
} from '../src/utils/installation-directory';
import { major } from 'semver';
import { readJsonFile } from '../src/utils/fileutils';
import { execSync } from 'child_process';

const workspace = findWorkspaceRoot(process.cwd());
// new is a special case because there is no local workspace to load
if (
  process.argv[2] === 'new' ||
  process.argv[2] === '_migrate' ||
  process.argv[2] === 'init' ||
  (process.argv[2] === 'graph' && !workspace)
) {
  process.env.NX_DAEMON = 'false';
  require('nx/src/command-line/nx-commands').commandsObject.argv;
} else {
  if (workspace && workspace.type === 'nx') {
    require('v8-compile-cache');
  }
  // polyfill rxjs observable to avoid issues with multiple version of Observable installed in node_modules
  // https://twitter.com/BenLesh/status/1192478226385428483?s=20
  if (!(Symbol as any).observable)
    (Symbol as any).observable = Symbol('observable polyfill');

  if (!workspace) {
    output.log({
      title: `The current directory isn't part of an Nx workspace.`,
      bodyLines: [
        `To create a workspace run:`,
        chalk.bold.white(`npx create-nx-workspace@latest <workspace name>`),
        '',
        `To add Nx to existing workspace run with a workspace-specific nx.json:`,
        chalk.bold.white(`npx add-nx-to-monorepo@latest`),
        '',
        `To add the default nx.json file run:`,
        chalk.bold.white(`nx init`),
      ],
    });

    output.note({
      title: `For more information please visit https://nx.dev/`,
    });
    process.exit(1);
  }

  // Make sure that a local copy of Nx exists in workspace
  let localNx: string;
  try {
    localNx = resolveNx(workspace);
  } catch {
    // If we can't resolve a local copy of Nx, we must be global.
    warnIfUsingOutdatedGlobalInstall();
    output.error({
      title: `Could not find Nx modules in this workspace.`,
      bodyLines: [`Have you run ${chalk.bold.white(`npm/yarn install`)}?`],
    });
    process.exit(1);
  }

  // this file is already in the local workspace
  if (localNx === resolveNx(null)) {
    initLocal(workspace);
  } else {
    // Nx is being run from globally installed CLI - hand off to the local
    warnIfUsingOutdatedGlobalInstall(getLocalNxVersion(workspace));
    if (localNx.includes('.nx')) {
      const nxWrapperPath = localNx.replace(/\.nx.*/, '.nx/') + 'nxw.js';
      require(nxWrapperPath);
    } else {
      require(localNx);
    }
  }
}

function resolveNx(workspace: WorkspaceTypeAndRoot | null) {
  // prefer Nx installed in .nx/installation
  try {
    return require.resolve('nx/bin/nx.js', {
      paths: workspace ? [getNxInstallationPath(workspace.dir)] : undefined,
    });
  } catch {}

  // check for root install
  try {
    return require.resolve('nx/bin/nx.js', {
      paths: workspace ? [workspace.dir] : undefined,
    });
  } catch {
    // fallback for old CLI install setup
    return require.resolve('@nrwl/cli/bin/nx.js', {
      paths: workspace ? [workspace.dir] : undefined,
    });
  }
}

/**
 * Assumes currently running Nx is global install.
 * Warns if out of date by 1 major version or more.
 */
function warnIfUsingOutdatedGlobalInstall(localNxVersion?: string) {
  const globalVersion = require('../package.json').version;
  const isOutdatedGlobalInstall =
    globalVersion &&
    ((localNxVersion && major(globalVersion) < major(localNxVersion)) ||
      (!localNxVersion &&
        getLatestVersionOfNx() &&
        major(globalVersion) < major(getLatestVersionOfNx())));

  // Using a global Nx Install
  if (isOutdatedGlobalInstall) {
    const bodyLines = localNxVersion
      ? [
          `Your repository uses a higher version of Nx (${localNxVersion}) than your global CLI version (${globalVersion})`,
        ]
      : [];

    bodyLines.push(
      'For more information, see https://nx.dev/more-concepts/global-nx'
    );
    output.warn({
      title: `Its time to update Nx 🎉`,
      bodyLines,
    });
  }
}

function getLocalNxVersion(workspace: WorkspaceTypeAndRoot): string {
  return readJsonFile(
    require.resolve('nx/package.json', {
      paths: getNxRequirePaths(workspace.dir),
    })
  ).version;
}

function _getLatestVersionOfNx(): string {
  try {
    return execSync('npm view nx@latest version').toString().trim();
  } catch {
    try {
      return execSync('pnpm view nx@latest version').toString().trim();
    } catch {
      return null;
    }
  }
}

const getLatestVersionOfNx = ((fn: () => string) => {
  let cache: string = null;
  return () => cache || (cache = fn());
})(_getLatestVersionOfNx);
