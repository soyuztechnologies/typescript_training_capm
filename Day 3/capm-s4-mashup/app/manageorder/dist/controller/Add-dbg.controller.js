sap.ui.define(["./BaseController", "sap/m/MessageBox", "sap/m/MessageToast", "sap/ui/model/json/JSONModel"], function (__BaseController, MessageBox, MessageToast, JSONModel) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace com.ats.manageorder.controller
   */
  const Add = BaseController.extend("com.ats.manageorder.controller.Add", {
    onInit: function _onInit() {
      // here we need the router object - get it from our Component
      this.oRouter = this.getOwnerComponent().getRouter();
      // whenever the add route is hit, start with a fresh empty order
      this.oRouter.getRoute("addOrder")?.attachMatched(this.resetForm, this);
    },
    resetForm: function _resetForm() {
      // default payload mirrors the demo order; typed as NewSalesOrder (no id yet)
      const oNewOrder = {
        salesOrderType: "TA",
        salesOrganization: "BMGB",
        distributionChannel: "DB",
        organizationDivision: "AC",
        salesDistrict: "000001",
        soldToParty: "49",
        salesOrderDate: "2026-04-06",
        items: [{
          salesOrderItem: "10",
          material: "220",
          requestedQuantity: "5",
          requestedQuantityUnit: "PCE"
        }]
      };
      this.getView()?.setModel(new JSONModel(oNewOrder), "newOrder");
    },
    onAddItem: function _onAddItem() {
      // add a new empty item row to the table
      const oModel = this.getView()?.getModel("newOrder");
      const aItems = oModel.getProperty("/items");
      aItems.push({
        salesOrderItem: "",
        material: "",
        requestedQuantity: "",
        requestedQuantityUnit: ""
      });
      oModel.setProperty("/items", aItems);
    },
    onDeleteItem: function _onDeleteItem() {
      // Step 1: get the selected row of the items table
      const oTable = this.getView()?.byId("idNewItems");
      const oItem = oTable.getSelectedItem();
      if (!oItem) {
        MessageToast.show("Please select an item to delete.");
        return;
      }
      // Step 2: find the index of the row inside the items array
      const sPath = oItem.getBindingContext("newOrder").getPath();
      const iIndex = parseInt(sPath.split("/").pop(), 10);
      // Step 3: remove that row and refresh the binding
      const oModel = this.getView()?.getModel("newOrder");
      const aItems = oModel.getProperty("/items");
      aItems.splice(iIndex, 1);
      oModel.setProperty("/items", aItems);
    },
    onSave: function _onSave() {
      // collect the order data the user entered (input shape, no id yet)
      const oOrder = this.getView().getModel("newOrder").getData();

      // POST to the CAP action createSalesOrder(order: SalesOrderInput)
      fetch("/odata/v4/catalog/createSalesOrder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          order: oOrder
        })
      }).then(async oResponse => {
        // read body together with the http status so we can show S/4 errors
        const body = await oResponse.json();
        return {
          ok: oResponse.ok,
          body
        };
      }).then(oResult => {
        if (!oResult.ok) {
          const sMsg = oResult.body?.error?.message ?? "Create failed.";
          MessageBox.error(sMsg);
          return;
        }
        MessageToast.show(`Sales order ${oResult.body.salesOrder} created.`);

        // put the freshly created order at the top of the shared list
        const oOrdersModel = this.getOwnerComponent().getModel("orders");
        const aOrders = Array.isArray(oOrdersModel.getData()) ? oOrdersModel.getData() : [];
        aOrders.unshift(oResult.body);
        oOrdersModel.setData(aOrders);

        // open the new order in front of the user - it is now at index 0
        this.oRouter.navTo("spiderman", {
          orderId: 0
        });
      }).catch(oError => {
        MessageBox.error("Create failed: " + oError.message);
      });
    },
    onCancel: function _onCancel() {
      // leave the create screen without saving
      this.oRouter.navTo("leftSide");
    }
  });
  return Add;
});
//# sourceMappingURL=Add-dbg.controller.js.map
