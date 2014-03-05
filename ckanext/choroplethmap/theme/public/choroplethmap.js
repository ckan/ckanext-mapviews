ckan.module('choroplethmap', function ($, _) {
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
      },
      highlightStyle = {
        weight: 5
      },
      nonHighlightedStyle = {
        weight: 2
      },
      activeStyle = {
        opacity: 1,
        color: '#d73027'
      };

  function initialize() {
    var el = this.el,
        elementId = el.context.id,
        options = this.options,
        geojsonUrl = options.geojsonUrl,
        geojsonKeyField = options.geojsonKeyField,
        resourceKeyField = options.resourceKeyField,
        resourceValueField = options.resourceValueField,
        resourceLabelField = options.resourceLabelField,
        redirectToUrl = (options.redirectToUrl === true) ? '' : options.redirectToUrl,
        noDataLabel = this.i18n('noData'),
        map = L.map(elementId),
        resource = {
          id: options.resourceId,
          endpoint: options.endpoint || this.sandbox.client.endpoint + '/api'
        };

    $.when(
      $.getJSON(geojsonUrl),
      recline.Backend.Ckan.query({ size: 1000 }, resource)
    ).done(function (geojson, query) {
      var geojsonLayer,
          bounds,
          router,
          featuresValues = _mapResourceKeyFieldToValues(resourceKeyField,
                                                        resourceValueField,
                                                        resourceLabelField,
                                                        query.hits);

      var isInOwnResourceViewPage = $(el.parent()).hasClass('ckanext-datapreview');
      if (!isInOwnResourceViewPage) {
        router = _router(resourceKeyField, geojsonKeyField, redirectToUrl);
      }

      _addBaseLayer(map);
      geojsonLayer = _addGeoJSONLayer(map, geojson[0], geojsonKeyField, opacity, noDataLabel, featuresValues, router);
      bounds = geojsonLayer.getBounds().pad(0.1);

      map.fitBounds(bounds);
      map.setMaxBounds(bounds);
    });
  }

  function _mapResourceKeyFieldToValues(resourceKeyField, resourceValueField, resourceLabelField, data) {
    var mapping = {};

    $.each(data, function (i, d) {
      var key = d[resourceKeyField],
          label = d[resourceLabelField],
          value = d[resourceValueField];

      if (value) {
        mapping[key] = {
          label: label,
          value: parseFloat(value)
        };
      }
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

  function _addGeoJSONLayer(map, geojson, geojsonKeyField, opacity, noDataLabel, featuresValues, router) {
      var scale = _createScale(geojson, featuresValues);

      _addLegend(map, scale, opacity, noDataLabel);

      return L.geoJson(geojson, {
        style: _style(scale, opacity, geojsonKeyField, featuresValues),
        onEachFeature: _onEachFeature(geojsonKeyField, featuresValues, router)
      }).addTo(map);
  }

  function _createScale(geojson, featuresValues) {
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

  function _style(scale, opacity, geojsonKeyField, featuresValues) {
    return function (feature) {
      var value = featuresValues[feature.properties[geojsonKeyField]],
          color = (value) ? scale(value.value) : noDataColor;

      return $.extend({ fillColor: color }, defaultStyle);
    };
  }

  function _onEachFeature(geojsonKeyField, featuresValues, router) {
    var eventsCallbacks = {
      mouseover: _highlightFeature,
      mouseout: _resetHighlight
    };

    if (router) {
      eventsCallbacks.click = router.toggleActive;
    }

    return function (feature, layer) {
      var elementData = featuresValues[feature.properties[geojsonKeyField]];

      if (elementData && elementData.label && elementData.value) {
        var label = elementData.label + ': ' + elementData.value;

        if (router) {
          router.activateIfNeeded(layer);
        } else {
          layer.setStyle({ className: 'non-clickable' });
        }

        layer.bindLabel(label);
        layer.on(eventsCallbacks);
      }
    };
  }

  function _formatNumber(num) {
    return (num % 1 ? num.toFixed(2) : num);
  }

  function _highlightFeature(e) {
    var layer = e.target;

    layer.setStyle(highlightStyle);

    if (!L.Browser.ie && !L.Browser.opera) {
      layer.bringToFront();
    }
  }

  function _resetHighlight(e) {
    e.target.setStyle(nonHighlightedStyle);
  }

  function _router(filterName, geojsonKeyField, redirectToUrl) {
    var activeFeatures = [];

    activeFeatures = _getActiveFilters();

    function toggleActive(e) {
      var layer = e.target,
          id = layer.feature.properties[geojsonKeyField],
          index = $.inArray(id, activeFeatures);

      if (index !== -1) {
        activeFeatures.splice(index, 1);
        layer.setStyle(defaultStyle);
      } else {
        activeFeatures.push(id);
        layer.setStyle(activeStyle);
      }

      _redirectTo(redirectToUrl, _updateFilters(filterName, activeFeatures));
    }

    function activateIfNeeded(layer) {
      var id = layer.feature.properties[geojsonKeyField];

      if ($.inArray(id, activeFeatures) !== -1) {
        layer.setStyle(activeStyle);
      }
    }

    function _getActiveFilters() {
      var routeParams = window.location.search.queryStringToJSON(),
          filters = _parseRouteFilters(routeParams);

      return filters[filterName] || [];
    }

    function _redirectTo(url, filters) {
      var originalParams = url.queryStringToJSON(),
          params = $.extend({}, filters, originalParams),
          aElement = document.createElement('a');

      aElement.href = url;
      aElement.search = $.param(params);

      window.location.href = aElement.href;
    }

    function _updateFilters(filterName, features) {
      var routeParams = window.location.search.queryStringToJSON(),
          filters = _parseRouteFilters(routeParams);

      filters[filterName] = features;
      routeParams.filters = $.map(filters, function (fields, filter) {
        var fieldsStr = $.map(fields, function (field) {
          return filter + ':' + field;
        });

        return fieldsStr.join('|');
      }).join('|');

      return routeParams;
    }

    function _parseRouteFilters(routeParams) {
      // The filters are in format "field:value|field:value|field:value"
      if (!routeParams || !routeParams.filters) {
        return {};
      }
      var filters = {},
          fieldValuesStr = routeParams.filters.split("|");

      $.each(fieldValuesStr, function (i, fieldValueStr) {
        var fieldValue = fieldValueStr.split(":"),
            field = fieldValue[0],
            value = fieldValue[1];

        filters[field] = filters[field] || [];
        filters[field].push(value);
      });

      return filters;
    }

    return {
      toggleActive: toggleActive,
      activateIfNeeded: activateIfNeeded
    };
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
