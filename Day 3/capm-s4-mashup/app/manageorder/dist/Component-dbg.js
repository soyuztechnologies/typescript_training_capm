sap.ui.define(["sap/ui/core/UIComponent", "./model/models"], function (UIComponent, ___model_models) {
  "use strict";

  const createDeviceModel = ___model_models["createDeviceModel"];
  /**
   * @namespace com.ats.manageorder
   */
  const Component = UIComponent.extend("com.ats.manageorder.Component", {
    metadata: {
      manifest: "json",
      interfaces: ["sap.ui.core.IAsyncContentCreation"]
    },
    init: function _init() {
      // call the base component's init function
      UIComponent.prototype.init.call(this);

      // enable routing
      this.getRouter().initialize();

      // set the device model
      this.setModel(createDeviceModel(), "device");
    }
  });
  return Component;
});
//# sourceMappingURL=Component-dbg.js.map
