import logging
from pylons import config

log = logging.getLogger(__name__)


def mapviews_get_common_map_config():
    '''
        Returns a dict with all configuration options related to the common
        base map (ie those starting with 'ckanext.spatial.common_map.')
    '''
    namespace = 'ckanext.spatial.common_map.'
    return dict([(k.replace(namespace, ''), v) for k, v in config.iteritems() if k.startswith(namespace)])