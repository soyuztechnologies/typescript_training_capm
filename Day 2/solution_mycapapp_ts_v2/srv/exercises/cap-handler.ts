// ── Reusable method decorator: logs name, args, and execution time ────
export function LogRequest<This, Args extends unknown[], Return>(     // rows 1, 2
  originalMethod: (this: This, ...args: Args) => Return,
  context: ClassMethodDecoratorContext<This, (this: This, ...args: Args) => Return>
) {
  const methodName = String(context.name)                            // row 3

  function replacement(this: This, ...args: Args): Return {          // rows 4, 5
    const start = performance.now()
    console.log(`→ ${methodName}(${safeArgs(args)})`)

    const finish = () => {
      const ms = (performance.now() - start).toFixed(2)
      console.log(`← ${methodName} finished in ${ms}ms`)
    }

    const result = originalMethod.apply(this, args)                 // row 6
    if (result instanceof Promise) {
      return result.finally(finish) as Return                       // row 7
    }
    finish()
    return result
  }

  return replacement
}

// CAP request objects are circular — guard the stringify
function safeArgs(args: unknown[]): string {
  try {
    return JSON.stringify(args)
  } catch {
    return '[args not serializable]'
  }
}