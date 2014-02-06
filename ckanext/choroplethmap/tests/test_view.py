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
