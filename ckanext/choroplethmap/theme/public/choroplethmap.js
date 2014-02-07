ckan.module("choroplethmap", function ($) {
  "use strict";

  function initialize() {
    var elementId = this.el.context.id,
        geojsonUrl = this.options.geojsonUrl,
        geojsonKeyField = this.options.geojsonKeyField,
        resourceKeyField = this.options.resourceKeyField,
        resourceValueField = this.options.resourceValueField,
        map = L.map(elementId, { zoomControl: false }),
        resource = {
          id: this.options.resourceId,
          endpoint: this.options.endpoint || window.location.origin + '/api'
        };

    $.when(
      $.getJSON(geojsonUrl),
      recline.Backend.Ckan.query({}, resource)
    ).done(function (geojson, query) {
      var geojsonLayer,
          keyValues = _mapResourceKeyFieldToValues(resourceKeyField,
                                                   resourceValueField,
                                                   query.hits);
      geojsonLayer = _addGeoJSONLayer(map, geojson[0], geojsonKeyField, keyValues);
      map.fitBounds(geojsonLayer.getBounds());
      _disableZoomAndPan(map);
    });
  }

  function _mapResourceKeyFieldToValues(resourceKeyField, resourceValueField, data) {
    var mapping = {};

    $.each(data, function (i, d) {
      mapping[d[resourceKeyField]] = parseFloat(d[resourceValueField]);
    });

    return mapping;
  }

  function _addGeoJSONLayer(map, geojson, geojsonKeyField, keyValues) {
      var scale = _createScale(geojson, keyValues);

      _addLegend(map, scale);

      return L.geoJson(geojson, {
        style: _geoJsonStyle(scale, geojsonKeyField, keyValues)
      }).addTo(map);
  }

  function _disableZoomAndPan(map) {
    map.dragging.disable();
    map.touchZoom.disable();
    map.doubleClickZoom.disable();
    map.scrollWheelZoom.disable();
    if (map.tap) {
      map.tap.disable();
    }
  }

  function _geoJsonStyle(scale, geojsonKeyField, keyValues) {
    return function (feature) {
      return {
        fillColor: scale(keyValues[feature.properties[geojsonKeyField]]),
        fillOpacity: 1,
        weight: 2,
        color: "#031127"
      };
    };
  }

  function _createScale(geojson, keyValues) {
    var colors = ['#F7FBFF', '#DEEBF7', '#C6DBEF', '#9ECAE1', '#6BAED6',
                  '#4292C6', '#2171B5', '#08519C', '#08306B'],
        values = $.map(keyValues, function (value, key) {
          return value;
        }).sort(function (a, b) { return a - b; }),
        min = values[0],
        max = values[values.length - 1];

    return d3.scale.quantize()
             .domain([min, max])
             .range(colors);
  }

  function _addLegend(map, scale) {
    var legend = L.control({ position: 'bottomright' });

    legend.onAdd = function (map) {
      var div = L.DomUtil.create('div', 'info legend'),
          domain = scale.domain(),
          range = scale.range(),
          min = domain[0],
          max = domain[domain.length - 1],
          step = (max - min)/range.length,
          grades = $.map(range, function (_, i) { return (min + step * i); }),
          labels = [];

      for (var i = 0, len = grades.length; i < len; i++) {
          div.innerHTML +=
              '<i style="background:' + scale(grades[i]) + '"></i> ' +
              _formatNumber(grades[i]) +
                (grades[i + 1] ? '&ndash;' + _formatNumber(grades[i + 1]) + '<br>' : '+');
      }

      return div;
    }

    legend.addTo(map);
  }

  function _formatNumber(num) {
    return (num % 1 ? num.toFixed(2) : num);
  }

  return {
    initialize: initialize
  };
});
