import ckan.plugins as p

not_empty = p.toolkit.get_validator('not_empty')


class ChoroplethMap(p.SingletonPlugin):
    '''Creates a choropleth map view'''

    p.implements(p.IConfigurer, inherit=True)
    p.implements(p.IResourceView, inherit=True)

    def update_config(self, config):
        p.toolkit.add_template_directory(config, 'theme/templates')
        p.toolkit.add_resource('theme/public', 'choroplethmap')

    def info(self):
        schema = {
            'geojson_url': [not_empty],
            'geojson_key_field': [not_empty],
            'resource_key_field': [not_empty],
            'resource_value_field': [not_empty]
        }

        return {'name': 'choropleth-map',
                'title': 'Choropleth Map',
                'icon': 'map-marker',
                'schema': schema,
                'iframed': False}

    def can_view(self, data_dict):
        return data_dict['resource'].get('datastore_active', False)

    def setup_template_variables(self, context, data_dict):
        resource = data_dict['resource']
        resource_view = data_dict['resource_view']
        fields = _get_fields_without_id(resource)

        return {'resource': resource,
                'resource_view': resource_view,
                'fields': fields}

    def view_template(self, context, data_dict):
        return 'choroplethmap_view.html'

    def form_template(self, context, data_dict):
        return 'choroplethmap_form.html'


def _get_fields_without_id(resource):
    fields = _get_fields(resource)
    return [{'value': v['id']} for v in fields if v['id'] != '_id']


def _get_fields(resource):
    data = {
        'resource_id': resource['id'],
        'limit': 0
    }
    result = p.toolkit.get_action('datastore_search')({}, data)
    return result['fields']
