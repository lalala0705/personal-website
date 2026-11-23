"""Publish podcast metadata only; persist rotated credentials as encrypted cache."""
import base64
from datetime import datetime, timedelta, timezone
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import sys
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]
spec = importlib.util.spec_from_file_location('xyz', Path(__file__).with_name('xiaoyuzhou-client.py'))
xyz = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xyz)


def safe_url(value):
    if not isinstance(value, str):
        return ''
    try:
        parts = urlsplit(value)
        return value if parts.scheme == 'https' and parts.hostname and not parts.username and not parts.password and not parts.query and not parts.fragment else ''
    except ValueError:
        return ''


def public_show(item):
    pid = item.get('pid', '')
    if not isinstance(pid, str) or not re.fullmatch('[a-fA-F0-9]{24}', pid) or not isinstance(item.get('title'), str):
        raise ValueError('节目资料格式异常。')
    return {'id': pid, 'title': item['title'], 'author': item.get('author', '') if isinstance(item.get('author', ''), str) else '',
            'description': item.get('brief', '') if isinstance(item.get('brief', ''), str) else '',
            'cover': safe_url((item.get('image') or {}).get('picUrl')), 'url': 'https://www.xiaoyuzhoufm.com/podcast/' + pid, 'tone': 'sage'}


def public_episode(item, show):
    eid = item.get('eid', '')
    if not isinstance(eid, str) or not re.fullmatch('[a-fA-F0-9]{24}', eid) or not isinstance(item.get('title'), str):
        raise ValueError('单集资料格式异常。')
    stamp = item.get('pubDate', '')
    date = datetime.fromisoformat(stamp.replace('Z', '+00:00')).astimezone(timezone(timedelta(hours=8))).strftime('%Y-%m-%d') if stamp else ''
    return {'id': eid, 'title': item['title'], 'showId': show['id'], 'showTitle': show['title'],
            'date': date, 'cover': show['cover'], 'url': 'https://www.xiaoyuzhoufm.com/episode/' + eid, 'tone': 'blue'}


def collect(client):
    shows, seen, cursor, cursors = [], set(), None, set()
    for page in range(100):
        params = {'limit': '200', 'sortOrder': 'desc', 'sortBy': 'subscribedAt'}
        if cursor:
            params['loadMoreKey'] = cursor
        body = client.post('/v1/subscription/list', params)
        for item in body['data']:
            show = public_show(item)
            if show['id'] not in seen:
                shows.append(show)
                seen.add(show['id'])
        cursor = body.get('loadMoreKey')
        if not cursor:
            break
        serialized = json.dumps(cursor, sort_keys=True)
        if serialized in cursors:
            raise ValueError('订阅分页重复；保留旧数据。')
        cursors.add(serialized)
    else:
        raise ValueError('订阅列表未读取完整；保留旧数据。')
    episodes = []
    for show in shows:
        body = client.post('/v1/episode/list', {'pid': show['id'], 'limit': '3', 'order': 'desc'})
        episodes.extend(public_episode(item, show) for item in body['data'][:3])
    episodes.sort(key=lambda x: x['date'], reverse=True)
    return {'shows': shows, 'episodes': episodes[:60]}


def main():
    from cryptography.fernet import Fernet
    secret = os.environ.get('XIAOYUZHOU_TOKEN_JSON', '').strip()
    if not secret:
        raise ValueError('请先配置 XIAOYUZHOU_TOKEN_JSON。')
    cipher = Fernet(base64.urlsafe_b64encode(hashlib.sha256(secret.encode()).digest()))
    cache = ROOT / '.private-xyz-cache' / 'credentials.enc'
    credentials = json.loads(secret)
    if cache.exists():
        try:
            credentials = json.loads(cipher.decrypt(cache.read_bytes()))
        except Exception:
            # A newly configured Secret intentionally invalidates prior encrypted state.
            pass
    if not credentials.get('access_token') or not credentials.get('refresh_token'):
        raise ValueError('授权文件无效，请重新授权。')
    def save(value):
        cache.parent.mkdir(exist_ok=True, mode=0o700)
        cache.write_bytes(cipher.encrypt(json.dumps(value).encode()))
    save(credentials)
    result = collect(xyz.Client(credentials, save))
    target = ROOT / 'data/podcasts.js'
    target.write_text('// 小宇宙节目公开资料；不包含账号凭据和收听记录。\nwindow.xiaoyuzhouPodcasts = ' + json.dumps(result, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    print(f"已同步 {len(result['shows'])} 档节目、{len(result['episodes'])} 条最近更新。")


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        # Only generic messages; never print upstream bodies or credential values.
        print('同步未完成，请检查授权配置或账号状态；保留上次成功数据。', file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('小宇宙暂时无法连接，已保留上次数据；如授权过期请重新登录。', file=sys.stderr)
        sys.exit(1)
