import ckan.plugins as p


class ChoroplethMap(p.SingletonPlugin):
    '''Creates a choropleth map view'''

    p.implements(p.IConfigurer, inherit=True)
    p.implements(p.IResourceView, inherit=True)

    def update_config(self, config):
        p.toolkit.add_template_directory(config, 'theme/templates')
        p.toolkit.add_resource('theme/public', 'choroplethmap')

    def info(self):
        return {'icon': 'map-marker',
                'iframed': False}

    def can_view(self, data_dict):
        return data_dict['resource'].get('datastore_active', False)
