this.ckan = this.ckan || {};
this.ckan.views = this.ckan.views || {};

this.ckan.views.navigablemap = (function () {
  'use strict';

  var borderColor = '#031127',
      defaultStyle = {
        fillColor: '#4292C6',
        fillOpacity: 0.7,
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

  function initialize(element, options, noDataLabel, geojson, featuresValues) {
    var elementId = element.context.id,
        geojsonUrl = options.geojsonUrl,
        geojsonKeyField = options.geojsonKeyField,
        resourceKeyField = options.resourceKeyField,
        redirectToUrl = (options.redirectToUrl === true) ? '' : options.redirectToUrl,
        filterFields = options.filterFields,
        map = L.map(elementId),
        geojsonLayer,
        bounds,
        maxBounds,
        router;

    var isInOwnResourceViewPage = $(element.parent()).hasClass('ckanext-datapreview');
    if (!isInOwnResourceViewPage) {
      router = _router(resourceKeyField, geojsonKeyField, redirectToUrl, filterFields, featuresValues);
    }

    _addBaseLayer(map);
    geojsonLayer = _addGeoJSONLayer(map, geojson, geojsonKeyField, noDataLabel, featuresValues, router);
    bounds = geojsonLayer.getBounds();
    maxBounds = bounds.pad(0.1);

    map.fitBounds(bounds);
    map.setMaxBounds(maxBounds);

    return map;
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

  function _addGeoJSONLayer(map, geojson, geojsonKeyField, noDataLabel, featuresValues, router) {
    return L.geoJson(geojson, {
      style: _style(),
      onEachFeature: _onEachFeature(geojsonKeyField, featuresValues, router, noDataLabel)
    }).addTo(map);
  }

  function _style() {
    return defaultStyle;
  }

  function _onEachFeature(geojsonKeyField, featuresValues, router, noDataLabel) {
    var eventsCallbacks = {
      mouseover: _highlightFeature,
      mouseout: _resetHighlight
    };

    if (router) {
      eventsCallbacks.click = router.toggleActive;
    }

    return function (feature, layer) {
      var elementData = featuresValues[feature.properties[geojsonKeyField]];

      if (router && elementData) {
        router.activateIfNeeded(layer);
      } else {
        layer.setStyle({ className: 'non-clickable' });
      }

      if (elementData && elementData.label) {
        layer.bindLabel(elementData.label);
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

  function _router(resourceKeyField, geojsonKeyField, redirectToUrl, filterFields, featuresValues) {
    var activeFeatures = _getActiveFeatures(resourceKeyField, featuresValues),
        filterFieldsWithResourceKeyField = filterFields.slice();

    filterFieldsWithResourceKeyField.push(resourceKeyField);

    function _getActiveFeatures(filterName, features) {
      var filters = _getFilters(),
          activeFeaturesKeys = filters[filterName] || [],
          result = [];

      $.each(activeFeaturesKeys, function (i, key) {
        if (features[key]) {
          result.push(features[key]);
        }
      });

      return result;
    }

    function toggleActive(e) {
      var layer = e.target,
          id = layer.feature.properties[geojsonKeyField],
          filters = _getFilters(),
          feature = featuresValues[id],
          index = $.inArray(feature, activeFeatures);

      // Toggle this feature
      if (index !== -1) {
        activeFeatures.splice(index, 1);
        layer.setStyle(defaultStyle);
      } else {
        activeFeatures.push(feature);
        layer.setStyle(activeStyle);
      }

      // Update filters
      filters[resourceKeyField] = $.map(activeFeatures, function (feature) {
        return $.map(filterFieldsWithResourceKeyField, function (field) {
          return feature.data[field];
        });
      });

      filters[resourceKeyField] = _array_unique(filters[resourceKeyField]);

      _redirectTo(redirectToUrl, _updateFilters(filters));
    }

    function activateIfNeeded(layer) {
      var id = layer.feature.properties[geojsonKeyField],
          feature = featuresValues[id],
          filters = _getFilters();

      if ($.inArray(feature, activeFeatures) !== -1) {
        layer.setStyle(activeStyle);
      }
    }

    function _getFilters() {
      return ckan.views.viewhelpers.filters.get();
    }

    function _array_unique(array) {
      var result = [],
          i;

      for (i = 0; i < array.length; i++) {
        if (result.indexOf(array[i]) === -1) {
          result.push(array[i]);
        }
      }

      return result;
    }

    function _redirectTo(url, filters) {
      var originalParams = url.queryStringToJSON(),
          params = $.extend({}, filters, originalParams),
          aElement = document.createElement('a');

      aElement.href = url;
      aElement.search = $.param(params);

      window.location.href = aElement.href;
    }

    function _updateFilters(filters) {
      var routeParams = window.location.search.queryStringToJSON();

      routeParams.filters = $.map(filters, function (fields, filter) {
        var fieldsStr = $.map(fields, function (field) {
          return filter + ':' + field;
        });

        return fieldsStr.join('|');
      }).join('|');

      return routeParams;
    }

    return {
      toggleActive: toggleActive,
      activateIfNeeded: activateIfNeeded
    };
  }

  return initialize;
})();
