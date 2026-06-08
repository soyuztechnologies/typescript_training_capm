//consume reference of my DB tables
using { anubhav.db.master, anubhav.db.transaction } from '../db/datamodel';

service CatalogService @(path: 'CatalogService', requires: 'authenticated-user') {

    //Entity  - representation of an end point of data to perform CRUDQ tasks
    entity EmployeeSet as projection on master.employee;
    entity PurchaseItemsSet as projection on transaction.poitems;
    entity ProductSet as projection on master.product;
    entity BusinessPartnerSet as projection on master.businesspartner;
    entity StatusCode as projection on master.StatusCode;
    entity PurchaseOrderSet @(
        odata.draft.enabled: true,
        Common.DefaultValuesFunction : 'getOrderDefaults'
    ) as projection on transaction.purchaseorder{
        *,
        case OVERALL_STATUS
            when 'N' then 'New'
            when 'P' then 'Pending'
            when 'A' then 'Approved'
            when 'X' then 'Rejected'
            else 'Delivered' end as OverallStatus: String(20),
        case OVERALL_STATUS
            when 'N' then 0
            when 'P' then 0
             when 'A' then 2
            when 'X' then 1
            else 3 end as Criticality: Integer,
            Items

    }
    actions{
        @cds.odata.bindingparameter.name : '_anubhav'
        @Common.SideEffects : {
                TargetProperties : ['_anubhav/GROSS_AMOUNT']
            }  
        action boost() returns PurchaseItemsSet;
        action setOrderProcessing();
    };

    
    function largestOrder() returns array of PurchaseOrderSet;
}