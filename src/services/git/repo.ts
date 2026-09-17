/** Repository operations: root resolution and head info via git (REQ-3). */

import { spawn } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { GitError, type HeadInfo } from './types.js'

export async function resolveRoot(cwd: string = process.cwd()): Promise<string> {
  const out = await runGit(['rev-parse', '--show-toplevel'], cwd)
  return resolvePath(out.trim())
}

export async function getHeadInfo(cwd: string = process.cwd()): Promise<HeadInfo> {
  const root = await resolveRoot(cwd)

  let branch = ''
  try {
    const branchOut = await runGit(['branch', '--show-current'], root)
    branch = branchOut.trim()
  } catch {
    // Ignore error
  }

  if (!branch) {
    try {
      const abbrevOut = await runGit(['rev-parse', '--abbrev-ref', 'HEAD'], root)
      const abbrev = abbrevOut.trim()
      if (abbrev) {
        branch = abbrev
      }
    } catch {
      // Ignore error
    }
  }

  let commitHash = ''
  try {
    const hashOut = await runGit(['rev-parse', '--short', 'HEAD'], root)
    commitHash = hashOut.trim()
  } catch {
    // Ignore error
  }

  return { branch, commitHash }
}

export function runGit(args: string[], cwd: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn('git', args, { cwd, stdio: ['ignore', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', (d) => (stdout += d))
    child.stderr.on('data', (d) => (stderr += d))
    child.on('error', (err) => reject(new GitError('GIT_FAILED', `failed to launch git: ${err.message}`)))
    child.on('close', (code) => {
      if (code === 0) {
        resolve(stdout)
        return
      }
      const message = (stderr || stdout).trim()
      if (code === 128 && message.includes('not a git repository')) {
        reject(new GitError('NOT_A_REPO', message))
        return
      }
      reject(new GitError('GIT_FAILED', message || `git exited with code ${code}`))
    })
  })
}