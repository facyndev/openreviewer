/** CLI argument parsing with ref validation (REQ-2, threat matrix: git repo selection). */

export interface CliArgs {
  range?: { from: string; to: string }
  help: boolean
}

const REF_RE = /^[^\s-][^\s]*$/

export class ArgError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ArgError'
  }
}

export function parseArgs(argv: string[]): CliArgs {
  const out: CliArgs = { help: false }
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i]
    if (arg === '--help' || arg === '-h') {
      out.help = true
      continue
    }
    if (arg === '--diff') {
      const value = argv[++i]
      if (value === undefined) throw new ArgError('--diff requires a value')
      const sep = value.indexOf('..')
      if (sep === -1 || sep === 0 || sep === value.length - 1 || value.indexOf('..', sep + 1) !== -1) {
        throw new ArgError(`invalid diff range: ${value}`)
      }
      const from = value.slice(0, sep)
      const to = value.slice(sep + 2)
      validateRef(from)
      validateRef(to)
      out.range = { from, to }
      continue
    }
    if (arg === '--from' || arg === '--to') {
      const value = argv[++i]
      if (value === undefined) throw new ArgError(`${arg} requires a value`)
      validateRef(value)
      out.range = { from: arg === '--from' ? value : 'HEAD', to: arg === '--to' ? value : 'HEAD' }
      out.range[arg === '--from' ? 'from' : 'to'] = value
      continue
    }
    throw new ArgError(`unknown option: ${arg}`)
  }
  return out
}

function validateRef(ref: string): void {
  if (!REF_RE.test(ref) || /[\u0000\n\r]/.test(ref)) {
    throw new ArgError(`invalid ref: ${ref}`)
  }
}