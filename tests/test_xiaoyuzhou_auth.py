import importlib.util
from pathlib import Path
import ssl
import unittest
import urllib.error
spec=importlib.util.spec_from_file_location('authorize_xyz',Path(__file__).parents[1]/'scripts/authorize-xiaoyuzhou.py')
auth=importlib.util.module_from_spec(spec)
spec.loader.exec_module(auth)

class AuthDiagnosticsTest(unittest.TestCase):
    def test_http_error_does_not_expose_url_or_headers(self):
        error=urllib.error.HTTPError('https://example.com/?secret=PRIVATE',403,'PRIVATE',{'token':'PRIVATE'},None)
        result=auth.safe_error(error)
        self.assertIn('HTTP 403',result)
        self.assertNotIn('PRIVATE',result)

    def test_network_errors_are_distinguished_without_raw_details(self):
        self.assertIn('TLS_CERT',auth.safe_error(urllib.error.URLError(ssl.SSLCertVerificationError('PRIVATE'))))
        self.assertIn('TIMEOUT',auth.safe_error(TimeoutError('PRIVATE')))
        self.assertNotIn('PRIVATE',auth.safe_error(ValueError('PRIVATE')))
