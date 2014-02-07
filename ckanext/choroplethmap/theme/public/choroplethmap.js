ckan.module("choroplethmap", function (jQuery) {
  "use strict";

  function initialize() {
    var id = this.el.attr('id'),
        geojsonUrl = this.options.geojsonUrl,
        map = L.map(id).setView([30.4, 69.3], 4);

    _addBaseLayer(map);
    _addGeoJSONLayer(map, geojsonUrl);
  }

  function _addBaseLayer(map) {
    L.tileLayer('http://{s}.tile.cloudmade.com/{key}/997/256/{z}/{x}/{y}.png', {
      key: 'd4fc77ea4a63471cab2423e66626cbb6',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
    }).addTo(map);
  }

  function _addGeoJSONLayer(map, geojsonUrl) {
    jQuery.getJSON(geojsonUrl, function (geojson) {
      L.geoJson(geojson, { style: _geoJsonStyle(geojson) }).addTo(map);
    });
  }

  function _geoJsonStyle(geojson) {
    var scale = _createScale(geojson);

    return function (feature) {
      return {
        fillColor: scale(feature.properties.OBJECTID),
        fillOpacity: 0.7,
        weight: 2
      };
    };
  }

  function _createScale(geojson) {
    var colors = ['red', 'green', 'blue'],
        values = jQuery.map(geojson.features, function (f) {
        return f.properties.OBJECTID;
      }).sort(),
        min = values[0],
        max = values[values.length - 1];

    return d3.scale.quantize()
             .domain([min, max])
             .range(colors);
  }

  return {
    initialize: initialize
  };
});
