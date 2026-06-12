sap.ui.define(["./BaseController", "sap/m/MessageBox", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "sap/ui/model/json/JSONModel"], function (__BaseController, MessageBox, Filter, FilterOperator, JSONModel) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace com.ats.manageorder.controller
   */
  const View1 = BaseController.extend("com.ats.manageorder.controller.View1", {
    onInit: function _onInit() {
      // here we need the router object - get it from our Component
      this.oRouter = this.getOwnerComponent().getRouter();
      // create a JSON model to hold the sales orders, shared with View2
      this.getOwnerComponent().setModel(new JSONModel(), "orders");
      // load the orders when the app starts
      this.getSalesOrders();
    },
    getSalesOrders: function _getSalesOrders() {
      fetch("/odata/v4/catalog/getSalesOrders()", {
        headers: {
          Accept: "application/json"
        }
      }).then(oResponse => oResponse.json()).then(oData => {
        const oModel = this.getOwnerComponent().getModel("orders");
        oModel.setData(oData.value || []);
      }).catch(oError => {
        MessageBox.error("Unable to load sales orders: " + oError.message);
      });
    },
    onAdd: function _onAdd() {
      // navigate to the Add view to create a brand new sales order
      this.oRouter.navTo("addOrder");
    },
    onSearch: function _onSearch(oEvent) {
      // Step 1: extract the query parameter
      const searchStr = oEvent.getParameter("query") ?? "";
      // Step 2: construct the filter conditions
      const oFilter1 = new Filter("salesOrder", FilterOperator.Contains, searchStr);
      const oFilter2 = new Filter("salesOrderType", FilterOperator.Contains, searchStr);
      // Step 3: combine with OR
      const oFilter = new Filter({
        filters: [oFilter1, oFilter2],
        and: false
      });
      // Step 4: get the list and inject the filter
      const oList = this.getView()?.byId("idList");
      oList.getBinding("items")?.filter(oFilter);
    },
    onItemPress: function _onItemPress(oEvent) {
      // get the clicked list item and its binding path e.g. /3
      const oListItem = oEvent.getParameter("listItem");
      const sPath = oListItem.getBindingContext("orders").getPath();
      const aParts = sPath.split("/");
      const sIndex = aParts[aParts.length - 1];
      // navigate to the detail view passing the selected order index
      this.oRouter.navTo("spiderman", {
        orderId: sIndex
      });
    }
  });
  return View1;
});
//# sourceMappingURL=View1-dbg.controller.js.map
