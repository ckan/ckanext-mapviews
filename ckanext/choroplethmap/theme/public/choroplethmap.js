ckan.module("choroplethmap", function (jQuery) {
  "use strict";

  function initialize() {
    var id = this.el.attr('id'),
        geojsonUrl = this.options.geojsonUrl,
        map = L.map(id).setView([30.4, 69.3], 4);

    L.tileLayer('http://{s}.tile.cloudmade.com/{key}/997/256/{z}/{x}/{y}.png', {
      key: 'd4fc77ea4a63471cab2423e66626cbb6',
      attribution: 'Map data &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors, <a href="http://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="http://cloudmade.com">CloudMade</a>',
      maxZoom: 18
    }).addTo(map);

    jQuery.getJSON(geojsonUrl, function (geojson) {
      L.geoJson(geojson).addTo(map);
    });
  }

  return {
    initialize: initialize
  };
});
