ckan.module("basiccharts_filters_form", function (jQuery) {
  "use strict";

  function initialize() {
    var self = this,
        templateFilterInputs = self.options.templateFilterInputs,
        filtersDiv = self.el.find(self.options.filtersSelector),
        addFilterEl = self.el.find(self.options.addFilterSelector),
        removeFilterSelector = self.options.removeFilterSelector;

    addFilterEl.click(function (evt) {
      evt.preventDefault();
      filtersDiv.append(templateFilterInputs);
    });

    filtersDiv.on("click", removeFilterSelector, function (evt) {
      evt.preventDefault();
      $(this).parent().remove();
    });
  }

  return {
    initialize: initialize
  };
});
