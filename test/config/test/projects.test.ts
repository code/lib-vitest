import { resolve } from 'pathe'
import { expect, it } from 'vitest'
import { runVitest } from '../../test-utils'

it('runs the workspace if there are several vitest config files', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/several-configs',
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('workspace/several-configs')
  expect(stdout).toContain('| 1_test')
  expect(stdout).toContain('| 2_test')
  expect(stdout).toContain('1 + 1 = 2')
  expect(stdout).toContain('2 + 2 = 4')
})

it('correctly resolves workspace projects with a several folder globs', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/several-folders',
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('test - a')
  expect(stdout).toContain('test - b')
})

it('supports glob negation pattern', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/negated',
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('test - a')
  expect(stdout).toContain('test - c')
  expect(stdout).not.toContain('test - b')
})

it('fails if project names are identical with a nice error message', async () => {
  const { stderr } = await runVitest({
    root: 'fixtures/workspace/invalid-duplicate-configs',
  }, [], 'test', {}, { fails: true })
  expect(stderr).toContain(
    `Project name "test" from "vitest2.config.js" is not unique. The project is already defined by "vitest1.config.js".

Your config matched these files:
 - vitest1.config.js
 - vitest2.config.js

All projects should have unique names. Make sure your configuration is correct.`,
  )
})

it('fails if project names are identical inside the inline config', async () => {
  const { stderr } = await runVitest({
    root: 'fixtures/workspace/invalid-duplicate-inline',
  }, [], 'test', {}, { fails: true })
  expect(stderr).toContain(
    'Project name "test" is not unique. All projects should have unique names. Make sure your configuration is correct.',
  )
})

it('fails if referenced file doesnt exist', async () => {
  const { stderr } = await runVitest({
    root: 'fixtures/workspace/invalid-non-existing-config',
  }, [], 'test', {}, { fails: true })
  expect(stderr).toContain(
    `Projects definition references a non-existing file or a directory: ${resolve('fixtures/workspace/invalid-non-existing-config/vitest.config.js')}`,
  )
})

it('vite import analysis is applied when loading workspace config', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/config-import-analysis',
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('test - a')
})

it('can define inline workspace config programmatically', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/api',
    env: {
      TEST_ROOT: '1',
    },
    projects: [
      {
        extends: true,
        test: {
          name: 'project-1',
        },
      },
      {
        test: {
          name: 'project-2',
          env: {
            TEST_ROOT: '2',
          },
        },
      },
      {
        extends: './vite.custom.config.js',
        test: {
          name: 'project-3',
        },
      },
    ],
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('project-1')
  expect(stdout).toContain('project-2')
  expect(stdout).toContain('project-3')
  expect(stdout).toContain('3 passed')
})

it('correctly inherits the root config', async () => {
  const { stderr, stdout } = await runVitest({
    root: 'fixtures/workspace/config-extends',
  })
  expect(stderr).toBe('')
  expect(stdout).toContain('repro.test.js > importing a virtual module')
})

it('fails if workspace is empty', async () => {
  const { stderr } = await runVitest({
    projects: [],
  })
  expect(stderr).toContain('No projects were found. Make sure your configuration is correct. The projects definition: [].')
})

it('fails if workspace is filtered by the project', async () => {
  const { stderr } = await runVitest({
    project: 'non-existing',
    root: 'fixtures/workspace/config-empty',
    config: './vitest.config.js',
    projects: [
      './vitest.config.js',
    ],
  })
  expect(stderr).toContain(`No projects were found. Make sure your configuration is correct. The filter matched no projects: non-existing. The projects definition: [
    "./vitest.config.js"
].`)
})
