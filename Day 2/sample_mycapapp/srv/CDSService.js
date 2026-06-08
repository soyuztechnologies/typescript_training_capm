const cds = require('@sap/cds')
const { flattenPayload, project } = require('../utils/payload-transformer')
const { mapError } = require('../utils/error-mapper')

module.exports = class CDSService extends cds.ApplicationService { init() {

  const { ProductSet, ItemsSet } = cds.entities('CDSService')

  this.before (['CREATE', 'UPDATE'], ProductSet, async (req) => {
    console.log('Before CREATE/UPDATE ProductSet', req.data)
  })
  // Demo: deliberately cause a runtime error so the error handler is triggered.
  // Trigger on demand with:
  //   GET /CDSService/ProductSet?simulateError=true   -> plain Error (application error)
  //   GET /CDSService/ProductSet?simulateError=type   -> native TypeError (system error)
  //
  // CAP treats native JS errors (TypeError, ReferenceError, ...) as *system
  // errors* (cds.error.isSystemError). Normally, with the default
  // shutdown_on_uncaught_errors=true, those SHUT DOWN the server instead of
  // reaching this.on('error'). We set shutdown_on_uncaught_errors=false in
  // package.json so even native errors are routed to the error handler.
  this.before ('READ', ProductSet, (req) => {
    const query = (req.http && req.http.req && req.http.req.query) || {}
    if (query.simulateError === 'true') {
      throw new Error('Simulated runtime error while reading ProductSet')
    }
    if (query.simulateError === 'type') {
      const broken = undefined
      // Throws: TypeError: Cannot read properties of undefined (reading 'toUpperCase')
      return broken.toUpperCase()
    }
  })
  this.after ('READ', ProductSet, async (productSet, req) => {
    // Flatten + project the response into clean rows for logging.
    const rows = project(flattenPayload(productSet), ['ProductId', 'Description', 'Price'])
    console.log('After READ ProductSet', rows)

    let ids = productSet.map(p => p.ProductId)

    const partnerCount = await SELECT.from(ItemsSet)
                                 .columns('ProductId', {func: 'count', as: 'count'})
                                 .where({'ProductId': {in: ids}})
                                 .groupBy('ProductId');

    for (const p of productSet) {
      const partner = partnerCount.find(pc => pc.ProductId === p.ProductId)
      p.soldCount = partner ? partner.count : 0
    }

    
  })
  this.before (['CREATE', 'UPDATE'], ItemsSet, async (req) => {
    console.log('Before CREATE/UPDATE ItemsSet', req.data)
  })
  this.after ('READ', ItemsSet, async (itemsSet, req) => {
    console.log('After READ ItemsSet', flattenPayload(itemsSet))
  })

  // Normalise every error into a consistent { code, message, status } shape.
  this.on('error', (err, req) => {
    const normalised = mapError(err)
    console.error('CDSService error', normalised)
    err.code = normalised.code
    err.message = normalised.message
  })

  return super.init()
}}
