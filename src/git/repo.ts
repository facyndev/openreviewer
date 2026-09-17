/** Repository operations: root resolution via git rev-parse (REQ-3). */

import { spawn } from 'node:child_process'
import { resolve as resolvePath } from 'node:path'
import { GitError } from './types.js'

export async function resolveRoot(cwd: string = process.cwd()): Promise<string> {
  const out = await runGit(['rev-parse', '--show-toplevel'], cwd)
  return resolvePath(out.trim())
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