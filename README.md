ckanext-choroplethmap
=====================

This extension adds choropleth maps to CKAN, using the new Resource View being
developed in https://github.com/ckan/ckan/tree/1251-resource-view.

It uses [LeafletJS](http://leafletjs.com), which is compatible with all major
browsers (including IE7+).

Installation
------------

To use it, simply clone this repository and run ```python setup.py install```.
Then add ```choroplethmap``` to the list in ```ckan.plugins``` in your CKAN
config file.

Restart your webserver. You should see the new "Choropleth Map" chart type as
an option in the view type's list on any resource that's in the DataStore.
