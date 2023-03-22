import { buildEsbuildOptions } from './build-esbuild-options';
import { ExecutorContext } from 'nx/src/config/misc-interfaces';
import path = require('path');

describe('buildEsbuildOptions', () => {
  const context: ExecutorContext = {
    projectName: 'myapp',
    projectsConfigurations: {
      version: 2,
      projects: {
        myapp: {
          root: 'apps/myapp',
        },
      },
    },
    projectGraph: {
      nodes: {
        myapp: {
          type: 'app',
          name: 'myapp',
          data: { root: 'apps/myapp', files: [] },
        },
      },
      dependencies: { myapp: [] },
    },
    nxJsonConfiguration: {},
    isVerbose: false,
    root: path.join(__dirname, 'fixtures'),
    cwd: path.join(__dirname, 'fixtures'),
    target: {
      executor: '@nrwl/esbuild:esbuild',
      options: {
        outputPath: 'dist/apps/myapp',
      },
    },
  };

  it('should include environment variables for platform === browser', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: true,
          platform: 'browser',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          assets: [],
          outputFileName: 'index.js',
          singleEntry: true,
          external: [],
        },
        context
      )
    ).toEqual({
      bundle: true,
      define: expect.objectContaining({
        'process.env.NODE_ENV': '"test"',
      }),
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'browser',
      outfile: 'dist/apps/myapp/index.js',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.js',
      },
    });
  });

  it('should support multiple entry points', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: true,
          platform: 'browser',
          main: 'apps/myapp/src/index.ts',
          additionalEntryPoints: ['apps/myapp/src/extra-entry.ts'],
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          assets: [],
          outputFileName: 'index.js',
          singleEntry: false,
          external: [],
        },
        context
      )
    ).toEqual({
      bundle: true,
      define: expect.objectContaining({
        'process.env.NODE_ENV': '"test"',
      }),
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts', 'apps/myapp/src/extra-entry.ts'],
      format: 'esm',
      platform: 'browser',
      outdir: 'dist/apps/myapp',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.js',
      },
    });
  });

  it('should support cjs format', () => {
    expect(
      buildEsbuildOptions(
        'cjs',
        {
          bundle: true,
          platform: 'browser',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          assets: [],
          outputFileName: 'index.js',
          singleEntry: true,
          external: [],
        },
        context
      )
    ).toEqual({
      bundle: true,
      define: expect.objectContaining({
        'process.env.NODE_ENV': '"test"',
      }),
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'cjs',
      platform: 'browser',
      outfile: 'dist/apps/myapp/index.cjs',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.cjs',
      },
    });
  });

  it('should not define environment variables for node', () => {
    expect(
      buildEsbuildOptions(
        'cjs',
        {
          bundle: true,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          assets: [],
          outputFileName: 'index.js',
          singleEntry: true,
          external: [],
        },
        context
      )
    ).toEqual({
      bundle: true,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'cjs',
      platform: 'node',
      outfile: 'dist/apps/myapp/index.cjs',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.cjs',
      },
    });
  });

  it('should respect user defined outExtension', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: true,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          external: [],
          esbuildOptions: {
            outExtension: {
              '.js': '.mjs',
            },
          },
        },
        context
      )
    ).toEqual({
      bundle: true,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'node',
      outfile: 'dist/apps/myapp/index.mjs',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.mjs',
      },
    });

    expect(
      buildEsbuildOptions(
        'cjs',
        {
          bundle: true,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          external: [],
          esbuildOptions: {
            outExtension: {
              '.js': '.js',
            },
          },
        },
        context
      )
    ).toEqual({
      bundle: true,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'cjs',
      platform: 'node',
      outfile: 'dist/apps/myapp/index.js',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.js',
      },
    });

    // ESM cannot be mapped to .cjs so ignore
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: true,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          external: [],
          esbuildOptions: {
            outExtension: {
              '.js': '.cjs',
            },
          },
        },
        context
      )
    ).toEqual({
      bundle: true,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'node',
      outfile: 'dist/apps/myapp/index.js',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: [],
      outExtension: {
        '.js': '.js',
      },
    });
  });

  it('should respect user defined external', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: true,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          external: ['foo'],
          esbuildOptions: {
            external: ['bar'],
          },
        },
        context
      )
    ).toEqual({
      bundle: true,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'node',
      outfile: 'dist/apps/myapp/index.js',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: ['bar', 'foo'],
      outExtension: {
        '.js': '.js',
      },
    });
  });

  it('should not set external if --bundle=false', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: false,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          external: ['foo'],
        },
        context
      )
    ).toEqual({
      bundle: false,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'node',
      outdir: 'dist/apps/myapp',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: undefined,
      outExtension: {
        '.js': '.js',
      },
    });
  });

  it('should set sourcemap', () => {
    expect(
      buildEsbuildOptions(
        'esm',
        {
          bundle: false,
          platform: 'node',
          main: 'apps/myapp/src/index.ts',
          outputPath: 'dist/apps/myapp',
          tsConfig: 'apps/myapp/tsconfig.app.json',
          project: 'apps/myapp/package.json',
          outputFileName: 'index.js',
          assets: [],
          singleEntry: true,
          sourcemap: true,
          external: [],
        },
        context
      )
    ).toEqual({
      bundle: false,
      entryNames: '[dir]/[name]',
      entryPoints: ['apps/myapp/src/index.ts'],
      format: 'esm',
      platform: 'node',
      outdir: 'dist/apps/myapp',
      tsconfig: 'apps/myapp/tsconfig.app.json',
      external: undefined,
      sourcemap: true,
      outExtension: {
        '.js': '.js',
      },
    });
  });
});
