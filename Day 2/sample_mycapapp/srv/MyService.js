//Implementation file - js with same name
//DPC_EXT class you write in ABAP for Service implementation
const cds = require('@sap/cds')

module.exports = class MyService extends cds.ApplicationService { init() {

  this.on ('anubhav', async (req) => {
    console.log('On anubhav', req.data)
    let myName = req.data.name;

    return `Welcome to CAP Server, Hello ${myName}!! How are you today 🤔`
  })


      //Please overwrite the standard behavior of my entity
    this.on("READ",'ReadEmpSrv', async (req,res) => {

        var whereCondition = req.data;
        console.log(whereCondition);
        // if(whereCondition.hasOwnProperty("ID")){
        results = await cds.tx(req).run(SELECT.from(employees).limit(10).where(whereCondition));
        // }else{
            // results = await cds.tx(req).run(SELECT.from(employees).limit(1));
        // }
        for (let i = 0; i < results.length; i++) {
            results[i].nameMiddle = "changed!";            
        }
        return results;
    });


    
    this.on("CREATE", "InserEmployeeSrv", async(req,res) => {
        var dataSet = req.data;
        let returnData = await cds.transaction(req).run([
            INSERT.into(employees).entries(dataSet)
        ]).then((resolve, reject)=>{
            if(typeof(resolve) !== undefined){
                return req.data;
            }else{
                req.error(500,"Create Failed");
            }
        }).catch( err => {
            req.error(500,"There was an error "+ err.toString());
        });
        return returnData;
    });

    this.on("UPDATE", "UpdateEmployeeSrv", async(req,res) => {
        var dataSet = req.data;
        let returnData = await cds.transaction(req).run([
            UPDATE(employees).set({
                nameFirst: req.data.nameFirst
            }).where({ID: req.data.ID}),
            UPDATE(employees).set({
                nameLast: req.data.nameLast
            }).where({ID: req.data.ID})
        ]).then((resolve, reject)=>{
            if(typeof(resolve) !== undefined){
                return req.data;
            }else{
                req.error(500,"Create Failed");
            }
        }).catch( err => {
            req.error(500,"There was an error "+ err.toString());
        });
        return returnData;
    });

    this.on("DELETE", "DeleteEmployeeSrv", async(req,res) => {
        var dataSet = req.data;
        console.log(req.data.ID)
        let returnData = await cds.transaction(req).run([
            DELETE.from(employees).where({ID: req.data.ID})
        ]).then((resolve, reject)=>{
            if(typeof(resolve) !== undefined){
                return req.data;
            }else{
                req.error(500,"Create Failed");
            }
        }).catch( err => {
            req.error(500,"There was an error "+ err.toString());
        });

        return returnData;
    });
  //calling parent class constructor here
  return super.init()
}}
