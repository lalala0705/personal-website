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

    def test_qr_confirm_saves_tokens_without_logging_them(self):
        import contextlib
        import io
        import json
        import tempfile
        from unittest.mock import patch
        class Response:
            def __init__(self,body,headers=None):
                self.data=io.BytesIO(json.dumps(body).encode())
                self.headers=headers or {}
            def read(self,*args): return self.data.read(*args)
            def __enter__(self): return self
            def __exit__(self,*args): pass
        class Opener:
            calls=[]
            def open(self,req,timeout):
                self.calls.append(req.full_url)
                if req.full_url.endswith('/create'):
                    return Response({'id':'test-id','url':'https://www.xiaoyuzhoufm.com/qr-code?test=PRIVATE_QR'})
                return Response({'status':'CONFIRMED'},{'x-jike-access-token':'PRIVATE_ACCESS','x-jike-refresh-token':'PRIVATE_REFRESH'})
        opener=Opener()
        with tempfile.TemporaryDirectory() as folder:
            home=Path(folder)
            output=io.StringIO()
            with patch.object(auth.Path,'home',return_value=home), patch('urllib.request.build_opener',return_value=opener), patch('webbrowser.open'), patch('time.sleep'), contextlib.redirect_stdout(output):
                self.assertEqual(auth.main(),0)
            saved=json.loads((home/'.personal-website/xiaoyuzhou-token.json').read_text())
            self.assertEqual(saved['access_token'],'PRIVATE_ACCESS')
            self.assertNotIn('PRIVATE_ACCESS',output.getvalue())
            self.assertNotIn('PRIVATE_REFRESH',output.getvalue())
            self.assertNotIn('PRIVATE_QR',output.getvalue())
            self.assertFalse((home/'.personal-website/xiaoyuzhou-login.svg').exists())
            self.assertTrue(all(url.startswith('https://web-api.xiaoyuzhoufm.com/v1/auth/qrcode/') for url in opener.calls))
