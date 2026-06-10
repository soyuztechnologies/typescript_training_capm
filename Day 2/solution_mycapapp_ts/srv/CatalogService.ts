import cds from '@sap/cds'
import { EmployeeSet_, PurchaseOrderSet_, PurchaseItemsSet_ } from '#cds-models/CatalogService'

export default class CatalogService extends cds.ApplicationService {
  init() {
    // handlers…

    this.before(['CREATE', 'UPDATE'], EmployeeSet_, async (req) => {
      console.log('Aa gaya ' + req.data.salaryAmount)
      if (parseFloat(String(req.data.salaryAmount)) >= 1000000) {
        req.error(500, 'Salary must be less than a million for employee')
      }
    })

    this.after('READ', EmployeeSet_, async (employeeSet, req) => {
      console.log('After READ EmployeeSet', employeeSet)
    })
    this.before(['CREATE', 'UPDATE'], PurchaseOrderSet_, async (req) => {
      console.log('Before CREATE/UPDATE PurchaseOrderSet', req.data)
    })
    this.after('READ', PurchaseOrderSet_, async (purchaseOrderSet, req) => {
      console.log('After READ PurchaseOrderSet', purchaseOrderSet)
    })
    this.before(['CREATE', 'UPDATE'], PurchaseItemsSet_, async (req) => {
      console.log('Before CREATE/UPDATE PurchaseItemsSet', req.data)
    })
    this.after('READ', PurchaseItemsSet_, async (purchaseItemsSet, req) => {
      console.log('After READ PurchaseItemsSet', purchaseItemsSet)
    })


    this.on('boost', async (req) => {
      try {
        const ID = req.params[0]
        console.log('Hey Amigo, Your purchase order with id ' + JSON.stringify(req.params[0]) + ' will be boosted')
        const tx = cds.tx(req)
        await tx.update(PurchaseOrderSet_).with({
          GROSS_AMOUNT: { '+=': 20000 },
          NOTE: 'Boosted!!'
        } as any).where(ID)
      } catch (error) {
        return 'Error ' + String(error)
      }
    })

    this.on('largestOrder', async (req) => {                                        // row 7: dropped res
      try {
        const tx = cds.tx(req)
        const reply = await tx.read(PurchaseOrderSet_).
        orderBy({ GROSS_AMOUNT: 'desc' } as any).limit(1)  // row 2
        return reply
      } catch (error) {
        return 'Error ' + String(error)                                            // row 4
      }
    })

    this.on('getOrderDefaults', async req => {
      return { OVERALL_STATUS: 'N' }
    })

    this.on('setOrderProcessing', PurchaseOrderSet_, async req => {                  // row 2
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_, (req.params[0] as { ID: string }).ID)       // rows 2, 6
        .set({ OVERALL_STATUS: 'D' } as any)
    })

    return super.init()
  }
}