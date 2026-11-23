import importlib.util
from pathlib import Path
import unittest
spec=importlib.util.spec_from_file_location('sync_xyz',Path(__file__).parents[1]/'scripts/sync-xiaoyuzhou.py')
sync=importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)

class PodcastTest(unittest.TestCase):
    def test_publish_only_metadata(self):
        show=sync.public_show({'pid':'a'*24,'title':'播客','brief':'简介','access_token':'SECRET','uid':'PRIVATE','readTrackInfo':{'history':'private'}})
        self.assertNotIn('SECRET',str(show))
        self.assertNotIn('PRIVATE',str(show))
        self.assertNotIn('readTrackInfo',show)
        episode=sync.public_episode({'eid':'b'*24,'title':'单集','pubDate':'2026-11-22T20:00:00Z','audio':'private'},show)
        self.assertEqual(episode['date'],'2026-11-23')
        self.assertNotIn('audio',episode)

    def test_reject_urls_and_identifiers(self):
        for url in ['javascript:alert(1)','https://example.com/?token=SECRET','https://user:pass@example.com/']:
            self.assertEqual(sync.safe_url(url),'')
        with self.assertRaises(ValueError):
            sync.public_show({'pid':'../../token','title':'bad'})

    def test_paginate_subscriptions_and_sort_episodes(self):
        class Client:
            calls=0
            def post(self,path,params):
                if path=='/v1/subscription/list':
                    self.calls+=1
                    if self.calls==1:
                        return {'data':[{'pid':'a'*24,'title':'A'}],'loadMoreKey':'next'}
                    return {'data':[{'pid':'b'*24,'title':'B'}]}
                return {'data':[{'eid':params['pid'],'title':'new','pubDate':'2026-11-23T00:00:00Z'}]}
        result=sync.collect(Client())
        self.assertEqual(len(result['shows']),2)
        self.assertEqual(len(result['episodes']),2)

    def test_rotated_credentials_are_only_persisted_encrypted(self):
        import base64
        import hashlib
        import json
        import os
        import tempfile
        from unittest.mock import patch
        from cryptography.fernet import Fernet
        secret=json.dumps({'access_token':'TEST_ACCESS','refresh_token':'TEST_REFRESH'})
        class Client:
            def __init__(self,credentials,save):
                credentials['access_token']='ROTATED_ACCESS'
                save(credentials)
            def post(self,path,params):
                return {'data':[]}
        with tempfile.TemporaryDirectory() as folder:
            root=Path(folder)
            (root/'data').mkdir()
            with patch.object(sync,'ROOT',root), patch.object(sync.xyz,'Client',Client), patch.dict(os.environ,{'XIAOYUZHOU_TOKEN_JSON':secret}):
                sync.main()
            public=(root/'data/podcasts.js').read_text()
            encrypted=(root/'.private-xyz-cache/credentials.enc').read_bytes()
            self.assertNotIn('TEST_ACCESS',public)
            self.assertNotIn('ROTATED_ACCESS',public)
            self.assertNotIn(b'ROTATED_ACCESS',encrypted)
            cipher=Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest()))
            self.assertEqual(json.loads(cipher.decrypt(encrypted))['access_token'],'ROTATED_ACCESS')

if __name__=='__main__':
    unittest.main()
