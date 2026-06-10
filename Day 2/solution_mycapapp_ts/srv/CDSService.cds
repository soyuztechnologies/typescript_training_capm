//consume reference of my DB tables
using { anubhav.cds } from '../db/CDSViews';

service CDSService @(path:'CDSService') {

    entity ProductSet as projection on cds.CDSViews.ProductView{
        *,
        virtual soldCount : Int16
    };
    entity ItemsSet as projection on cds.CDSViews.ItemView;

}