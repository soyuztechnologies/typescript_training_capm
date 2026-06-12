sap.ui.define([], function () {
  "use strict";

  /**
   * Formatter helpers — pure functions, no UI5 base class needed.
   */
  function getStatus(code) {
    switch (code) {
      case "A":
        return "Available";
      case "D":
        return "Discontinued";
      case "O":
        return "Out of Stock";
      default:
        return "";
    }
  }
  function getStatusColor(code) {
    switch (code) {
      case "A":
        return "Success";
      case "D":
        return "Error";
      case "O":
        return "Warning";
      default:
        return "None";
    }
  }

  // Show a readable text for the sales order type code e.g. TA => Standard Order
  function getOrderTypeDescription(code) {
    switch (code) {
      case "TA":
      case "OR":
        return "Standard Order";
      case "RE":
        return "Returns Order";
      case "CR":
        return "Credit Memo Request";
      case "DR":
        return "Debit Memo Request";
      case "KB":
        return "Consignment Fill-Up";
      case "KE":
        return "Consignment Issue";
      case "KA":
        return "Consignment Pick-Up";
      case "KR":
        return "Consignment Returns";
      // if we do not know the code, just show the code itself
      default:
        return code;
    }
  }
  var __exports = {
    __esModule: true
  };
  __exports.getStatus = getStatus;
  __exports.getStatusColor = getStatusColor;
  __exports.getOrderTypeDescription = getOrderTypeDescription;
  return __exports;
});
//# sourceMappingURL=formatter-dbg.js.map
