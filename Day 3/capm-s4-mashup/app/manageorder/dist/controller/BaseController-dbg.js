sap.ui.define(["sap/ui/core/mvc/Controller", "../util/formatter"], function (Controller, formatter) {
  "use strict";

  /**
   * @namespace com.ats.manageorder.controller
   */
  const BaseController = Controller.extend("com.ats.manageorder.controller.BaseController", {
    constructor: function constructor() {
      Controller.prototype.constructor.apply(this, arguments);
      // exposed to every child controller and to the XML views
      this.formatter = formatter;
    }
  });
  return BaseController;
});
//# sourceMappingURL=BaseController-dbg.js.map
