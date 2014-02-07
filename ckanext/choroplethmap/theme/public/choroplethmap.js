ckan.module("choroplethmap", function ($) {
  "use strict";

  function initialize() {
    var elementId = this.el.context.id,
        geojsonUrl = this.options.geojsonUrl,
        geojsonProperty = this.options.geojsonProperty,
        map = L.map(elementId);

    $.getJSON(geojsonUrl, function (geojson) {
      var geojsonLayer;
      _addBaseLayer(map);
      geojsonLayer = _addGeoJSONLayer(map, geojson, geojsonProperty);
      map.fitBounds(geojsonLayer.getBounds());
    });
  }

  function _addBaseLayer(map) {
    return L.tileLayer('http://{s}.tile.cloudmade.com/{key}/997/256/{z}/{x}/{y}.png', {
      key: 'd4fc77ea4a63471cab2423e66626cbb6',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
    }).addTo(map);
  }

  function _addGeoJSONLayer(map, geojson, geojsonProperty) {
      var scale = _createScale(geojson, geojsonProperty);

      _addLegend(map, scale);

      return L.geoJson(geojson, {
        style: _geoJsonStyle(scale, geojsonProperty)
      }).addTo(map);
  }

  function _geoJsonStyle(scale, geojsonProperty) {
    return function (feature) {
      return {
        fillColor: scale(feature.properties[geojsonProperty]),
        fillOpacity: 0.7,
        weight: 2
      };
    };
  }

  function _createScale(geojson, geojsonProperty) {
    var colors = ['#F7FBFF', '#DEEBF7', '#C6DBEF', '#9ECAE1', '#6BAED6',
                  '#4292C6', '#2171B5', '#08519C', '#08306B'],
        values = $.map(geojson.features, function (f) {
          return f.properties[geojsonProperty];
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
              grades[i].toFixed() + (grades[i + 1] ? '&ndash;' + grades[i + 1].toFixed() + '<br>' : '+');
      }

      return div;
    }

    legend.addTo(map);
  }

  return {
    initialize: initialize
  };
});
