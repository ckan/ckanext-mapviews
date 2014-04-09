from setuptools import setup, find_packages
import sys, os

version = '0.1'

setup(
	name='ckanext-mapviews',
	version=version,
	description="Choropleth Map view for CKAN",
	long_description="""\
	""",
	classifiers=[], # Get strings from http://pypi.python.org/pypi?%3Aaction=list_classifiers
	keywords='',
	author='Vitor Baptista',
	author_email='vitor.baptista@okfn.org',
	url='https://github.com/ckan/ckanext-mapviews',
	license='',
	packages=find_packages(exclude=['*.tests']),
	namespace_packages=['ckanext', 'ckanext.mapviews'],
	include_package_data=True,
	zip_safe=False,
	install_requires=[
		# -*- Extra requirements: -*-
	],
	entry_points=\
	"""
    [ckan.plugins]
	navigablemap=ckanext.mapviews.plugin:NavigableMap
	choroplethmap=ckanext.mapviews.plugin:ChoroplethMap
	""",
)
