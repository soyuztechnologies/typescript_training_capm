import cds from '@sap/cds'
import { EmployeeSet_, PurchaseOrderSet_, PurchaseItemsSet_ } from '#cds-models/CatalogService'
import { LogRequest } from './exercises/cap-handler'                 // import the decorator

export default class CatalogService extends cds.ApplicationService {
  init() {
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

    this.on('boost', (req) => this.onBoost(req))                       // row 10: register by reference
    this.on('largestOrder', (req) => this.onLargestOrder(req))         // row 10

    this.on('getOrderDefaults', async req => {
      return { OVERALL_STATUS: 'N' }
    })
    this.on('setOrderProcessing', PurchaseOrderSet_, async req => {
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_, (req.params[0] as { ID: string }).ID)
        .set({ OVERALL_STATUS: 'D' } as any)
    })

    return super.init()
  }

  @LogRequest                                                        // row 8
  async onBoost(req: cds.Request) {
    try {
      const ID = req.params[0]
      console.log('Hey Amigo, Your purchase order with id ' + JSON.stringify(req.params[0]) + ' will be boosted')
      const tx = cds.tx(req)
      await tx.update(PurchaseOrderSet_).with({
        GROSS_AMOUNT: { '+=': 20000 },
        NOTE: 'Boosted!!'
      } as any).where(ID)

      return await tx.read(PurchaseOrderSet_).where(ID)
    } catch (error) {
      return 'Error ' + String(error)
    }
  }

  @LogRequest                                                        // row 8
  async onLargestOrder(req: cds.Request) {
    try {
      const tx = cds.tx(req)
      const reply = await tx.read(PurchaseOrderSet_)
        .orderBy({ GROSS_AMOUNT: 'desc' } as any).limit(1)
      return reply
    } catch (error) {
      return 'Error ' + String(error)
    }
  }
}