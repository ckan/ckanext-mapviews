this.ckan = this.ckan || {};
this.ckan.views = this.ckan.views || {};

this.ckan.views.choroplethmap = (function () {
  'use strict';

  var noDataColor = '#F7FBFF',
      borderColor = '#031127',
      opacity = 0.7,
      colors = ['#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6',
                '#2171B5', '#08519C', '#08306B'],
      defaultStyle = {
        // fillColor will be set depending on the feature's value
        fillOpacity: opacity,
        opacity: 0.1,
        weight: 2,
        color: borderColor
      };

  function initialize(element, options, noDataLabel, geojson, query) {
    var map = ckan.views.navigablemap(element, options, noDataLabel, geojson, query);
    var featuresValues = _mapResourceKeyFieldToValues(options.resourceKeyField,
                                                      options.resourceValueField,
                                                      options.resourceLabelField,
                                                      query.hits);
    var scale = _createScale(featuresValues);
    var onEachFeature = _onEachFeature(options.geojsonKeyField, featuresValues, noDataLabel, scale);

    $.each(map._layers, function (i, layer) {
      if (layer.feature !== undefined) {
        onEachFeature(layer.feature, layer);
      }
    });
    _addLegend(map, scale, opacity, noDataLabel);
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

  function _createScale(featuresValues) {
    var values = $.map(featuresValues, function (feature, key) {
          return feature.value;
        }).sort(function (a, b) { return a - b; }),
        min = values[0],
        max = values[values.length - 1];

    return d3.scale.quantize()
             .domain([min, max])
             .range(colors);
  }

  function _addLegend(map, scale, opacity, noDataLabel) {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info'),
          ul = L.DomUtil.create('ul', 'legend'),
          domain = scale.domain(),
          range = scale.range(),
          min = domain[0] + 0.0000000001,
          max = domain[domain.length - 1],
          step = (max - min)/range.length,
          grades = $.map(range, function (_, i) { return (min + step * i); }),
          labels = [];

      div.appendChild(ul);
      for (var i = 0, len = grades.length; i < len; i++) {
          ul.innerHTML +=
              '<li><span style="background:' + scale(grades[i]) + '; opacity: ' + opacity + '"></span> ' +
              _formatNumber(grades[i]) +
                (grades[i + 1] ? '&ndash;' + _formatNumber(grades[i + 1]) + '</li>' : '+</li></ul>');
      }

      ul.innerHTML +=
          '<li><span style="background:' + noDataColor + '; opacity: ' + opacity + '"></span> ' +
          noDataLabel + '</li>';

      return div;
    };

    legend.addTo(map);
  }

  function _onEachFeature(geojsonKeyField, featuresValues, noDataLabel, scale) {
    return function (feature, layer) {
      var elementData = featuresValues[feature.properties[geojsonKeyField]],
          value = elementData && elementData.value,
          label = elementData && elementData.label,
          color = (value) ? scale(value) : noDataColor;

      layer.setStyle($.extend({ fillColor: color }, defaultStyle));

      if (label) {
        var layerLabel = elementData.label + ': ' + (value || noDataLabel);
        layer.bindLabel(layerLabel);
      } else {
        layer.bindLabel(noDataLabel);
      }
    };
  }

  function _formatNumber(num) {
    return (num % 1 ? num.toFixed(2) : num);
  }

  return initialize;
})();

ckan.module('choroplethmap', function ($, _) {
  'use strict';

  function initialize() {
    var self = this,
        el = self.el,
        options = self.options,
        geojsonUrl = options.geojsonUrl,
        noDataLabel = self.i18n('noData'),
        resource = {
          id: options.resourceId,
          endpoint: options.endpoint || self.sandbox.client.endpoint + '/api'
        };

    options.endpoint = resource.endpoint;

    $.when(
      $.getJSON(geojsonUrl),
      recline.Backend.Ckan.query({ size: 1000 }, resource)
    ).done(function (geojson, query) {
      ckan.views.choroplethmap(el, options, noDataLabel, geojson, query);
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
});
