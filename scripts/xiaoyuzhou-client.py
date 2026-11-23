"""Minimal read-only account client. Endpoints referenced from r266-tech/xiaoyuzhou.
No third-party service receives credentials; requests go to Xiaoyuzhou HTTPS hosts.
"""
import json
import urllib.request
import urllib.error
import uuid

API = 'https://api.xiaoyuzhoufm.com'
AUTH = 'https://podcaster-api.xiaoyuzhoufm.com'


def request(base, path, payload=None, token='', refresh=''):
    headers = {'Content-Type': 'application/json;charset=UTF-8',
               'User-Agent': 'Xiaoyuzhou/2.99.1(android 28)',
               'app-version': '2.99.1', 'os': 'android',
               'Origin': 'https://podcaster.xiaoyuzhoufm.com',
               'Referer': 'https://podcaster.xiaoyuzhoufm.com/'}
    if base == AUTH:
        # Login endpoints use the web client headers, unlike app read endpoints.
        headers = {'Content-Type': 'application/json;charset=UTF-8',
                   'Accept': 'application/json, text/plain, */*',
                   'Origin': 'https://podcaster.xiaoyuzhoufm.com',
                   'Referer': 'https://podcaster.xiaoyuzhoufm.com/',
                   'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'}
    if token:
        headers['x-jike-access-token'] = token
    if refresh:
        headers['x-jike-refresh-token'] = refresh
    req = urllib.request.Request(base + path, data=json.dumps(payload or {}).encode(), headers=headers, method='POST')
    with urllib.request.urlopen(req, timeout=30) as response:
        body = json.load(response)
        if not isinstance(body, dict):
            raise ValueError('小宇宙返回格式异常。')
        return body, response.headers


class Client:
    def __init__(self, credentials, save=lambda value: None):
        self.credentials = credentials
        self.save = save

    def post(self, path, payload):
        if path not in ('/v1/subscription/list', '/v1/episode/list'):
            raise ValueError('仅允许订阅与节目读取。')
        try:
            body, _ = request(API, path, payload, token=self.credentials.get('access_token', ''))
        except urllib.error.HTTPError as error:
            if error.code != 401:
                raise
            body, headers = request(API, '/app_auth_tokens.refresh', refresh=self.credentials['refresh_token'])
            access = headers.get('x-jike-access-token') or body.get('x-jike-access-token')
            refresh = headers.get('x-jike-refresh-token') or body.get('x-jike-refresh-token')
            if not access:
                raise ValueError('授权已失效，请重新登录。')
            self.credentials['access_token'] = access
            if refresh:
                self.credentials['refresh_token'] = refresh
            self.save(self.credentials)
            body, _ = request(API, path, payload, token=access)
        if body.get('success') is False or body.get('code', 0) not in (0, '0', None):
            raise ValueError('小宇宙请求失败；已保留原有数据。')
        if not isinstance(body.get('data'), list):
            raise ValueError('小宇宙列表格式异常；已保留原有数据。')
        return body
