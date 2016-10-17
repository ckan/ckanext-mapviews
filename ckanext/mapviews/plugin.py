import urlparse

import ckan.plugins as p
import pylons.config as config

Invalid = p.toolkit.Invalid
_ = p.toolkit._
not_empty = p.toolkit.get_validator('not_empty')
ignore_missing = p.toolkit.get_validator('ignore_missing')
aslist = p.toolkit.aslist


def url_is_relative_or_in_same_domain(url):
    site_url = urlparse.urlparse(config.get('ckan.site_url', ''))
    parsed_url = urlparse.urlparse(url)

    is_relative = (parsed_url.netloc == '')
    is_in_same_domain = (parsed_url.netloc == site_url.netloc)

    if not (is_relative or is_in_same_domain):
        message = _('Must be a relative URL or in the same domain as CKAN')
        raise Invalid(message)

    return url


class NavigableMap(p.SingletonPlugin):
    '''Creates a map view'''

    p.implements(p.IConfigurer, inherit=True)
    p.implements(p.IResourceView, inherit=True)

    def update_config(self, config):
        p.toolkit.add_template_directory(config, 'theme/templates')
        p.toolkit.add_resource('theme/public', 'mapviews')

    def info(self):
        schema = {
            'geojson_url': [not_empty, url_is_relative_or_in_same_domain],
            'geojson_key_field': [not_empty],
            'resource_key_field': [not_empty],
            'resource_label_field': [not_empty],
            'redirect_to_url': [ignore_missing],
            #'filter_fields': [ignore_missing],
        }

        return {'name': 'navigable-map',
                'title': 'Navigable Map',
                'icon': 'map-marker',
                'schema': schema,
                'iframed': False,
                'filterable': True,
                }

    def can_view(self, data_dict):
        return data_dict['resource'].get('datastore_active', False)

    def setup_template_variables(self, context, data_dict):
        resource = data_dict['resource']
        resource_view = data_dict['resource_view']
        #filter_fields = aslist(resource_view.get('filter_fields', []))
        #resource_view['filter_fields'] = filter_fields
        geojson_resources = _get_geojson_resources()
        fields = _get_fields(resource)
        fields_without_id = _remove_id_and_prepare_to_template(fields)
        numeric_fields = _filter_numeric_fields_without_id(fields)
        textual_fields = _filter_textual_fields_without_id(fields)

        return {'resource': resource,
                'resource_view': resource_view,
                'geojson_resources': geojson_resources,
                'fields': fields_without_id,
                'numeric_fields': numeric_fields,
                'textual_fields': textual_fields}

    def view_template(self, context, data_dict):
        return 'navigablemap_view.html'

    def form_template(self, context, data_dict):
        return 'navigablemap_form.html'


class ChoroplethMap(NavigableMap):
    '''Creates a choropleth map view'''

    def info(self):
        info = super(ChoroplethMap, self).info()
        info['name'] = 'choropleth-map'
        info['title'] = 'Choropleth Map'
        info['schema']['resource_value_field'] = [not_empty]
        info['filterable'] = True

        return info

    def view_template(self, context, data_dict):
        return 'choroplethmap_view.html'

    def form_template(self, context, data_dict):
        return 'choroplethmap_form.html'


def _get_geojson_resources():
    data = {
        'query': 'format:geojson',
        'order_by': 'name',
    }
    result = p.toolkit.get_action('resource_search')({}, data)
    return [{'text': r['name'], 'value': r['url']}
            for r in result.get('results', [])]


def _get_fields(resource):
    data = {
        'resource_id': resource['id'],
        'limit': 0
    }
    result = p.toolkit.get_action('datastore_search')({}, data)
    return result.get('fields', [])


def _remove_id_and_prepare_to_template(fields):
    isnt_id = lambda v: v['id'] != '_id'
    return [{'value': v['id']} for v in fields if isnt_id(v)]


def _filter_numeric_fields_without_id(fields):
    isnt_id = lambda v: v['id'] != '_id'
    is_numeric = lambda v: v['type'] == 'numeric'
    return [{'value': v['id']} for v in fields if isnt_id(v) and is_numeric(v)]


def _filter_textual_fields_without_id(fields):
    isnt_id = lambda v: v['id'] != '_id'
    is_text = lambda v: v['type'] == 'text'
    return [{'value': v['id']} for v in fields if isnt_id(v) and is_text(v)]
