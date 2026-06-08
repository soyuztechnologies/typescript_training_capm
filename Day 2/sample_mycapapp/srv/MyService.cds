using { anubhav.db.master } from '../db/datamodel';


//definition of the service 
//SEGW - Define a service 
service MyService @(path: 'MyService'){
    //service end point
    //comment
    function anubhav(name: String) returns String;
    @readonly
    entity ReadEmpSrv as projection on master.employee;
     @insertonly
    entity InserEmployeeSrv as projection on master.employee;
    @updateonly
    entity UpdateEmployeeSrv as projection on master.employee;
    @deleteonly
    entity DeleteEmployeeSrv as projection on master.employee;
}