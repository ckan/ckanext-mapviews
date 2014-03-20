(function () {
  'use strict';

  function moduleInitializationFor(mapType) {
    return function ($, _) {
      function initialize() {
        var self = this,
            el = self.el,
            options = self.options,
            noDataLabel = self.i18n('noData'),
            resource = {
              id: options.resourceId,
              endpoint: options.endpoint || self.sandbox.client.endpoint + '/api'
            };

        $.when(
          $.getJSON(options.geojsonUrl),
          recline.Backend.Ckan.query({ size: 1000 }, resource)
        ).done(function (geojson, query) {
          var featuresValues = _mapResourceKeyFieldToValues(options.resourceKeyField,
                                                            options.resourceValueField,
                                                            options.resourceLabelField,
                                                            query.hits);

          ckan.views[mapType](el, options, noDataLabel, geojson[0], featuresValues);
        });
      }

      return {
        options: {
          i18n: {
            noData: _('No data')
          }
        },
        initialize: initialize
      };
    };
  }

  function _mapResourceKeyFieldToValues(resourceKeyField, resourceValueField, resourceLabelField, data) {
    var mapping = {};

    $.each(data, function (i, d) {
      var key = d[resourceKeyField],
          label = d[resourceLabelField],
          value = d[resourceValueField];

      mapping[key] = {
        key: key,
        label: label,
        data: d
      };

      if (value) {
        mapping[key].value = parseFloat(value);
      }
    });

    return mapping;
  }

  ckan.module('navigablemap', moduleInitializationFor('navigablemap'));
  ckan.module('choroplethmap', moduleInitializationFor('choroplethmap'));
})();
