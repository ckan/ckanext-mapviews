ckan.module('choroplethmap', function ($) {
  'use strict';

  function initialize() {
    var elementId = this.el.context.id,
        options = this.options,
        geojsonUrl = options.geojsonUrl,
        geojsonKeyField = options.geojsonKeyField,
        resourceKeyField = options.resourceKeyField,
        resourceValueField = options.resourceValueField,
        resourceLabelField = options.resourceLabelField,
        map = L.map(elementId),
        resource = {
          id: options.resourceId,
          endpoint: options.endpoint || this.sandbox.client.endpoint + '/api'
        };

    $.when(
      $.getJSON(geojsonUrl),
      recline.Backend.Ckan.query({}, resource)
    ).done(function (geojson, query) {
      var geojsonLayer,
          bounds,
          opacity = 0.7,
          featuresValues = _mapResourceKeyFieldToValues(resourceKeyField,
                                                        resourceValueField,
                                                        resourceLabelField,
                                                        query.hits);
      _addBaseLayer(map);
      geojsonLayer = _addGeoJSONLayer(map, geojson[0], geojsonKeyField, opacity, featuresValues);
      bounds = geojsonLayer.getBounds();

      map.fitBounds(bounds);
      map.setMaxBounds(bounds);
    });
  }

  function _mapResourceKeyFieldToValues(resourceKeyField, resourceValueField, resourceLabelField, data) {
    var mapping = {};

    $.each(data, function (i, d) {
      mapping[d[resourceKeyField]] = {
        label: d[resourceLabelField],
        value: parseFloat(d[resourceValueField])
      };
    });

    return mapping;
  }

  function _addBaseLayer(map) {
    var attribution = 'Map data &copy; OpenStreetMap contributors, Tiles ' +
                      'Courtesy of <a href="http://www.mapquest.com/"' +
                      'target="_blank">MapQuest</a> <img' +
                      'src="//developer.mapquest.com/content/osm/mq_logo.png">';

    return L.tileLayer('http://otile{s}.mqcdn.com/tiles/1.0.0/osm/{z}/{x}/{y}.png', {
      subdomains: '1234',
      attribution: attribution
    }).addTo(map);
  }

  function _addGeoJSONLayer(map, geojson, geojsonKeyField, opacity, featuresValues) {
      var scale = _createScale(geojson, featuresValues);

      _addLegend(map, scale, opacity);

      return L.geoJson(geojson, {
        style: _style(scale, opacity, geojsonKeyField, featuresValues),
        onEachFeature: _onEachFeature(geojsonKeyField, featuresValues)
      }).addTo(map);
  }

  function _createScale(geojson, featuresValues) {
    var colors = ['#F7FBFF', '#DEEBF7', '#C6DBEF', '#9ECAE1', '#6BAED6',
                  '#4292C6', '#2171B5', '#08519C', '#08306B'],
        values = $.map(featuresValues, function (feature, key) {
          return feature.value;
        }).sort(function (a, b) { return a - b; }),
        min = values[0],
        max = values[values.length - 1];

    return d3.scale.quantize()
             .domain([min, max])
             .range(colors);
  }

  function _addLegend(map, scale, opacity) {
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
              '<i style="background:' + scale(grades[i]) + '; opacity: ' + opacity + '"></i> ' +
              _formatNumber(grades[i]) +
                (grades[i + 1] ? '&ndash;' + _formatNumber(grades[i + 1]) + '<br>' : '+');
      }

      return div;
    }

    legend.addTo(map);
  }

  function _style(scale, opacity, geojsonKeyField, featuresValues) {
    return function (feature) {
      return {
        fillColor: scale(featuresValues[feature.properties[geojsonKeyField]].value),
        fillOpacity: opacity,
        weight: 2,
        color: '#031127'
      };
    };
  }

  function _onEachFeature(geojsonKeyField, featuresValues) {
    return function (feature, layer) {
      var elementData = featuresValues[feature.properties[geojsonKeyField]],
          label = elementData.label + ': ' + elementData.value;

      layer.bindLabel(label);
      layer.on({
        mouseover: _highlightFeature,
        mouseout: _resetHighlight
      });
    }
  }

  function _formatNumber(num) {
    return (num % 1 ? num.toFixed(2) : num);
  }

  function _highlightFeature(e) {
    var layer = e.target;

    layer.setStyle({
      weight: 5
    });

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
  }

  function _resetHighlight(e) {
    e.target.setStyle({
      weight: 2
    });
  }

  return {
    initialize: initialize
  };
});
