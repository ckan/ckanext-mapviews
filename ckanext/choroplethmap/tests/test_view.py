import os
import inspect
import pylons.config as config

import ckan.plugins as p


class TestChoroplethMap(object):

    @classmethod
    def setup_class(cls):
        p.load('choroplethmap')
        cls.plugin = p.get_plugin('choroplethmap')

    @classmethod
    def teardown_class(cls):
        p.unload('choroplethmap')

    def test_plugin_templates_path_is_added_to_config(self):
        filename = inspect.getfile(inspect.currentframe())
        path = os.path.dirname(filename)
        templates_path = os.path.abspath(path + "/../theme/templates")

        assert templates_path in config['extra_template_paths'], templates_path

    def test_can_view_is_true_when_datastore_is_active(self):
        active_datastore_data_dict = {
            'resource': { 'datastore_active': True }
        }
        assert self.plugin.can_view(active_datastore_data_dict)

    def test_can_view_is_false_when_datastore_is_inactive(self):
        inactive_datastore_data_dict = {
            'resource': { 'datastore_active': False }
        }
        assert not self.plugin.can_view(inactive_datastore_data_dict)

    def test_schema_exists(self):
        schema = self.plugin.info()['schema']
        assert schema is not None, 'Plugin should define schema'

    def test_schema_has_geojson_url(self):
        schema = self.plugin.info()['schema']
        assert schema.get('geojson_url') is not None, \
            'Schema should define "geojson_url"'

    def test_schema_geojson_url_isnt_empty(self):
        schema = self.plugin.info()['schema']
        not_empty = p.toolkit.get_validator('not_empty')
        assert not_empty in schema['geojson_url'], \
            '"geojson_url" should not be empty'

    def test_schema_has_geojson_property(self):
        schema = self.plugin.info()['schema']
        assert schema.get('geojson_property') is not None, \
            'Schema should define "geojson_property"'

    def test_schema_geojson_property_isnt_empty(self):
        schema = self.plugin.info()['schema']
        not_empty = p.toolkit.get_validator('not_empty')
        assert not_empty in schema['geojson_property'], \
            '"geojson_property" should not be empty'

    def test_plugin_isnt_iframed(self):
        iframed = self.plugin.info().get('iframed', True)
        assert not iframed, 'Plugin should not be iframed'

    def test_setup_template_variables_adds_resource(self):
        resource = {
            'id': 'resource_id',
        }

        template_variables = self._setup_template_variables(resource)

        assert 'resource' in template_variables
        assert template_variables['resource'] == resource

    def test_setup_template_variables_adds_resource_view(self):
        resource_view = {
            'id': 'resource_id',
            'other_attribute': 'value'
        }

        template_variables = \
            self._setup_template_variables(resource_view=resource_view)

        assert 'resource_view' in template_variables
        assert template_variables['resource_view'] == resource_view

    def _setup_template_variables(self, resource={}, resource_view={}):
        context = {}
        data_dict = {
            'resource': resource,
            'resource_view': resource_view
        }
        return self.plugin.setup_template_variables(context, data_dict)
