import cds, { Service } from '@sap/cds'

// Boot the CAP service against an in-memory SQLite DB (seeded from db/data/*.csv).
// Points at the project root (one level up from /test).
cds.test(__dirname + '/..')

// CatalogService is annotated `requires: 'authenticated-user'`, so every call
// must run with a user. We run each operation inside a privileged transaction,
// which satisfies the auth check while still executing all custom handlers.
const asAdmin = (fn: () => any): Promise<any> =>
  cds.tx({ user: cds.User.privileged }, fn)

describe('CatalogService', () => {
  let srv: Service

  beforeAll(async () => {
    srv = await cds.connect.to('CatalogService')
  })

  describe('largestOrder() function', () => {
    test('returns exactly one order', async () => {
      const reply = await asAdmin(() => srv.send('largestOrder'))
      expect(Array.isArray(reply)).toBe(true)
      expect(reply).toHaveLength(1)
    })

    test('returns the order with the highest GROSS_AMOUNT', async () => {
      const { reply, max } = await asAdmin(async () => {
        const reply = await srv.send('largestOrder')
        const all = await srv.read('PurchaseOrderSet').columns('GROSS_AMOUNT')
        const max = Math.max(...all.map((o: any) => Number(o.GROSS_AMOUNT)))
        return { reply, max }
      })
      expect(Number(reply[0].GROSS_AMOUNT)).toBe(max)
    })
  })

  describe('EmployeeSet salary validation (before CREATE/UPDATE)', () => {
    test('rejects a salary >= 1,000,000', async () => {
      await expect(
        asAdmin(() =>
          srv.create('EmployeeSet').entries({
            nameFirst: 'Rich',
            nameLast: 'Banks',
            salaryAmount: 1500000
          })
        )
      ).rejects.toMatchObject({
        code: 500,
        message: 'Salary must be less than a million for employee'
      })
    })

    test('accepts a salary below the limit', async () => {
      const created = await asAdmin(() =>
        srv.create('EmployeeSet').entries({
          nameFirst: 'Modest',
          nameLast: 'Earner',
          salaryAmount: 50000
        })
      )
      expect(created).toMatchObject({ salaryAmount: 50000 })
      expect(created.ID).toBeDefined()
    })
  })

  describe('PurchaseOrderSet projection', () => {
    test('exposes the computed OverallStatus text for each row', async () => {
      const orders = await asAdmin(() => srv.read('PurchaseOrderSet').limit(5))
      expect(orders.length).toBeGreaterThan(0)
      const allowed = ['New', 'Pending', 'Approved', 'Rejected', 'Delivered']
      for (const o of orders) {
        expect(allowed).toContain(o.OverallStatus)
      }
    })
  })
})
