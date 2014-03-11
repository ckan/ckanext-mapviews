ckanext-choroplethmap
=====================

![Pakistan choropleth map](doc/img/pakistan.png)

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

License
-------

Copyright (C) 2014 Open Knowledge Foundation

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
