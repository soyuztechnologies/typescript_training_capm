const cds = require('@sap/cds')

module.exports = class CatalogService extends cds.ApplicationService { init() {

  const { EmployeeSet, PurchaseOrderSet, PurchaseItemsSet } = cds.entities('CatalogService')

  this.before (['CREATE', 'UPDATE'], EmployeeSet, async (req) => {
    console.log("Aa gaya " + req.data.salaryAmount);
    if(parseFloat(req.data.salaryAmount) >= 1000000){
        req.error(500, "Salary must be less than a million for employee");
    }
  })
  this.after ('READ', EmployeeSet, async (employeeSet, req) => {
    console.log('After READ EmployeeSet', employeeSet)
  })
  this.before (['CREATE', 'UPDATE'], PurchaseOrderSet, async (req) => {
    console.log('Before CREATE/UPDATE PurchaseOrderSet', req.data)
  })
  this.after ('READ', PurchaseOrderSet, async (purchaseOrderSet, req) => {
    console.log('After READ PurchaseOrderSet', purchaseOrderSet)
  })
  this.before (['CREATE', 'UPDATE'], PurchaseItemsSet, async (req) => {
    console.log('Before CREATE/UPDATE PurchaseItemsSet', req.data)
  })
  this.after ('READ', PurchaseItemsSet, async (purchaseItemsSet, req) => {
    console.log('After READ PurchaseItemsSet', purchaseItemsSet)
  })

   this.on('boost', async (req,res) => {
        try {
            const ID = req.params[0];
            console.log("Hey Amigo, Your purchase order with id " + JSON.stringify(req.params[0]) + " will be boosted");
            const tx = cds.tx(req);
            //CDS Query Language - communicate to DB in agnostic manner
            await tx.update(PurchaseOrderSet).with({
                GROSS_AMOUNT: { '+=' : 20000 },
                NOTE: 'Boosted!!'
            }).where(ID);
        } catch (error) {
            return "Error " + error.toString();
        }
    });

    this.on('largestOrder', async (req,res) => {
        try {
            //const ID = req.params[0];
            const tx = cds.tx(req);
            
            //SELECT * UPTO 1 ROW FROM dbtab ORDER BY GROSS_AMOUNT desc
            const reply = await tx.read(PurchaseOrderSet).orderBy({
                GROSS_AMOUNT: 'desc'
            }).limit(1);

            return reply;
        } catch (error) {
            return "Error " + error.toString();
        }
    });

    this.on('getOrderDefaults', async req => {
        return {OVERALL_STATUS: 'N'};
      });

    //Implementation [service.js]
    this.on('setOrderProcessing', PurchaseOrderSet, async req => {
        const tx = cds.tx(req);
        await tx.update(PurchaseOrderSet, req.params[0].ID).set({OVERALL_STATUS: 'D'});
    });

  return super.init()
}}
