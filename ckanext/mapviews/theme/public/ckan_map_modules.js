(function () {
  'use strict';

  function moduleInitializationFor(mapType) {
    return function ($, _) {
      function initialize() {
        var self = this,
            el = self.el,
            options = self.options,
            noDataLabel = self.i18n('noData'),
            filterFields = self.options.filterFields,
            resource = {
              id: options.resourceId,
              endpoint: options.endpoint || self.sandbox.client.endpoint + '/api'
            };

        var filters = [];
        for (var filter in filterFields){
          if (filterFields.hasOwnProperty(filter)) {
            filters.push({
              "type": "term",
              "field": filter,
              "term": filterFields[filter]
            });
          }
        };

        var query = {
          size: 1000,
          filters: filters
        };

        $.when(
          $.getJSON(options.geojsonUrl),
          recline.Backend.Ckan.query(query, resource)
        ).done(function (geojson, query) {
          var featuresValues = _mapResourceKeyFieldToValues(options.resourceKeyField,
                                                            options.resourceValueField,
                                                            options.resourceLabelField,
                                                            options.geojsonKeyField,
                                                            geojson[0],
                                                            query.hits);

          ckan.views.mapviews[mapType](el, options, noDataLabel, geojson[0], featuresValues);
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

  function _mapResourceKeyFieldToValues(resourceKeyField, resourceValueField, resourceLabelField, geojsonKeyField, geojson, data) {
    var mapping = {},
        geojsonKeys = _getGeojsonKeys(geojsonKeyField, geojson);

    $.each(data, function (i, d) {
      var key = d[resourceKeyField],
          label = d[resourceLabelField],
          value = d[resourceValueField];

      if (geojsonKeys.indexOf(key) === -1) {
        return;
      }
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

  function _getGeojsonKeys(geojsonKeyField, geojson) {
    var result = [],
        features = geojson.features,
        i,
        len = features.length;

    for (i = 0; i < len; i++) {
      result.push(features[i].properties[geojsonKeyField]);
    }

    return result;
  }

  ckan.module('navigablemap', moduleInitializationFor('navigablemap'));
  ckan.module('choroplethmap', moduleInitializationFor('choroplethmap'));
})();
