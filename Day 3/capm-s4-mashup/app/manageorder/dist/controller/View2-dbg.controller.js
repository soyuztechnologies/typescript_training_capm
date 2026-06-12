sap.ui.define(["./BaseController"], function (__BaseController) {
  "use strict";

  function _interopRequireDefault(obj) {
    return obj && obj.__esModule && typeof obj.default !== "undefined" ? obj.default : obj;
  }
  const BaseController = _interopRequireDefault(__BaseController);
  /**
   * @namespace com.ats.manageorder.controller
   */
  const View2 = BaseController.extend("com.ats.manageorder.controller.View2", {
    onInit: function _onInit() {
      this.oRouter = this.getOwnerComponent().getRouter();
      this.oRouter.getRoute("spiderman")?.attachMatched(this.herculis, this);
    },
    herculis: function _herculis(oEvent) {
      const oView2 = this.getView();
      const sIndex = oEvent.getParameter("arguments").orderId;
      oView2.bindElement({
        path: "/" + sIndex,
        model: "orders"
      });
    }
  });
  return View2;
});
//# sourceMappingURL=View2-dbg.controller.js.map
