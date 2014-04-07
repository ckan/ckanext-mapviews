this.ckan = this.ckan || {};
this.ckan.views = this.ckan.views || {};
this.ckan.views.mapviews = this.ckan.views.mapviews || {};

this.ckan.views.mapviews.choroplethmap = (function () {
  'use strict';

  var noDataColor = '#F7FBFF',
      opacity = 0.7,
      colors = ['#C6DBEF', '#9ECAE1', '#6BAED6', '#4292C6',
                '#2171B5', '#08519C', '#08306B'],
      defaultStyle = {
        // fillColor will be set depending on the feature's value
        fillOpacity: opacity,
      };

  function initialize(element, options, noDataLabel, geojson, featuresValues) {
    var map = ckan.views.mapviews.navigablemap(element, options, noDataLabel, geojson, featuresValues),
        scale = _createScale(featuresValues, geojson),
        onEachFeature = _onEachFeature(options.geojsonKeyField, featuresValues, noDataLabel, scale);

    _addLegend(map, scale, opacity, noDataLabel);

    $.each(map._layers, function (i, layer) {
      if (layer.feature !== undefined) {
        onEachFeature(layer.feature, layer);
      }
    });
  }

  function _createScale(featuresValues, geojson) {
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
