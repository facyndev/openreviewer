import { render } from 'ink'
import { createElement } from 'react'
import { ArgError, parseArgs } from './args.js'
import { createGitService, GitError, type GitService } from '../services/git/index.js'
import { App } from '../ui/app.js'

const USAGE = `usage: openreviewer [--diff <a..b> | --from <ref> | --to <ref>] [--help]
  --diff <a..b>   review the diff between refs a and b
  --from <ref>    review from ref to HEAD (default)
  --to <ref>      review from HEAD to ref
  --help          show this help
`

function fail(message: string): never {
  process.stderr.write(`${message}\n`)
  process.exit(1)
}

export async function main(
  argv: string[],
  service: GitService = createGitService(),
): Promise<void> {
  let parsed
  try {
    parsed = parseArgs(argv)
  } catch (err) {
    if (err instanceof ArgError) {
      fail(err.message)
    }
    throw err
  }
  if (parsed.help) {
    process.stdout.write(USAGE)
    return
  }
  let diff
  let head = { branch: '', commitHash: '' }
  try {
    const [fetchedDiff, fetchedHead] = await Promise.all([
      service.getDiff(parsed.range),
      service.getHeadInfo().catch(() => ({ branch: '', commitHash: '' })),
    ])
    diff = fetchedDiff
    head = fetchedHead
  } catch (err) {
    if (err instanceof GitError) {
      fail(err.message)
    }
    throw err
  }
  const instance = render(
    createElement(App, {
      files: diff.files,
      branch: head.branch,
      commitHash: head.commitHash,
      gitService: service,
    }),
  )
  await instance.waitUntilExit()
  process.exit(0)
}

if (process.argv[1] && /openreviewer|main\.(ts|js)$/.test(process.argv[1])) {
  main(process.argv.slice(2))
}