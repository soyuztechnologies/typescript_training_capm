// CAP only resolves `.ts` service implementations (e.g. srv/CatalogService.ts)
// when CDS_TYPESCRIPT is set — see @sap/cds/lib/srv/factory.js. ts-jest compiles
// the handlers, but cds.test() still has to *find* them, so we enable the flag
// before any test boots the service.
process.env.CDS_TYPESCRIPT = 'true'
