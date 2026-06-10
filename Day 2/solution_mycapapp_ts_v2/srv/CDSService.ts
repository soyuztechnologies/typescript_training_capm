import cds from '@sap/cds'
import { ProductSet_, ItemsSet_ } from '#cds-models/CDSService'
import { flattenPayload, project } from '../utils/payload-transformer'
import { mapError } from '../utils/error-mapper'

export default class CDSService extends cds.ApplicationService {
  init() {

    this.after('READ', ProductSet_, async (products, req) => {
        if (!products) return                                            // row 10: drop | undefined

        const rows = project(
          flattenPayload(products as any) as Array<Record<string, unknown>>,   // row 11: cast at call site
          ['ProductId', 'Description', 'Price']
        )
        console.log('After READ ProductSet', rows)

        const ids = products.map(p => p.ProductId)                       // map the DATA, not ProductSet_

        const partnerCount = await SELECT.from(ItemsSet_)                 // plural class in CQL too
          .columns('ProductId', { func: 'count', as: 'count' })
          .where({ ProductId: { in: ids } })
          .groupBy('ProductId') as Array<{ ProductId: string; count: number }>   // row 8

        for (const p of products) {
          const partner = partnerCount.find(pc => pc.ProductId === p.ProductId)
          p.soldCount = partner ? partner.count : 0
        }
      });

    this.before('READ', ProductSet_, (req) => {
      const query = req.http?.req?.query ?? {}                          // rows 5, 6
      if ((query as Record<string, unknown>).simulateError === 'true') {  // row 7
        throw new Error('Simulated runtime error while reading ProductSet')
      }
      if ((query as Record<string, unknown>).simulateError === 'type') {
        const broken = undefined as unknown as string                   // row 9 (intentional bug)
        return broken.toUpperCase()
      }
    })


    this.before(['CREATE', 'UPDATE'], ItemsSet_, async (req) => {
      console.log('Before CREATE/UPDATE ItemsSet', req.data)
    })

    this.after('READ', ItemsSet_, async (items, req) => {
      console.log('After READ ItemsSet', flattenPayload(items as any))   // row 11: cast at call site
    })

    this.on('error', (err, req) => {
      const normalised = mapError(err)              // mapError already takes unknown
      const e = err as { code?: string; message?: string }
      e.code = normalised.code
      e.message = normalised.message
    })

    return super.init()
  }
}