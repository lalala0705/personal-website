"""Run locally with Python 3. Credentials are never printed or sent to GitHub."""
import importlib.util
import json
import os
from pathlib import Path
import sys
import ssl
import socket
import urllib.error

spec = importlib.util.spec_from_file_location('xyz', Path(__file__).with_name('xiaoyuzhou-client.py'))
xyz = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xyz)


STAGE = '启动'


def safe_error(error):
    prefix = '[' + STAGE + '] '
    if isinstance(error, urllib.error.HTTPError):
        status = error.code
        hint = {400: '接口不接受当前请求。', 401: '授权未通过。', 403: '请求被拒绝，可能需要官方页面验证或接口已变更。', 404: '当前登录接口不可用。', 429: '请求频率受限，请勿连续重试。'}.get(status, '接口返回错误。')
        return prefix + 'HTTP ' + str(status) + '：' + hint
    reason = error.reason if isinstance(error, urllib.error.URLError) else error
    if isinstance(reason, ssl.SSLCertVerificationError):
        return prefix + 'TLS_CERT：证书验证失败。请检查系统日期与 Python 证书配置；不要关闭证书验证。'
    if isinstance(reason, (TimeoutError, socket.timeout)):
        return prefix + 'TIMEOUT：连接超时，尚不能确认短信是否已发送。'
    if isinstance(reason, socket.gaierror):
        return prefix + 'DNS：无法解析小宇宙服务域名。'
    if isinstance(error, urllib.error.URLError):
        return prefix + 'NETWORK：网络连接失败，请检查本机网络或代理设置。'
    if isinstance(error, PermissionError):
        return prefix + 'FILE_PERMISSION：无法保存授权文件，请检查个人目录写入权限。'
    return prefix + 'FAILED：未完成；错误类型 ' + type(error).__name__ + '（未输出响应正文或凭据）。'


def save_credentials(credentials):
    directory = Path.home() / '.personal-website'
    directory.mkdir(mode=0o700, exist_ok=True)
    target = directory / 'xiaoyuzhou-token.json'
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as file:
        json.dump(credentials, file)
    print('授权文件已保存到：' + str(target))
    print('将该文件内容填入仓库 Actions Secret：XIAOYUZHOU_TOKEN_JSON。不要发到聊天或上传到公开仓库。')


def main():
    global STAGE
    import http.cookiejar
    import time
    import urllib.request
    from urllib.parse import urlsplit
    import webbrowser
    try:
        import qrcode
        from qrcode.image.svg import SvgPathImage
    except ImportError:
        print('请先运行：python -m pip install qrcode==8.2')
        return 1
    print('授权工具 v3 · 小宇宙 App 扫码登录，不发送短信')
    print('二维码仅保存在本机，请不要分享或上传。可随时按 Ctrl+C 取消。')
    jar = http.cookiejar.CookieJar()
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    headers = {'Content-Type': 'application/json;charset=UTF-8',
               'Accept': 'application/json, text/plain, */*',
               'Origin': 'https://accounts.xiaoyuzhoufm.com',
               'Referer': 'https://accounts.xiaoyuzhoufm.com/login',
               'x-jike-allow-app-token-in-cookie': 'true',
               'x-midway-app-id': 'v6worU4NnWyL',
               'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.0.0 Safari/537.36'}
    def post(path, body):
        req = urllib.request.Request('https://web-api.xiaoyuzhoufm.com/v1/auth/qrcode/' + path,
            data=json.dumps(body).encode(), headers=headers, method='POST')
        with opener.open(req, timeout=15) as response:
            return json.load(response), response.headers
    STAGE = '生成登录二维码'
    created, _ = post('create', {'clientId': 'xyz-web'})
    qr_id, qr_url = created.get('id'), created.get('url')
    if not isinstance(qr_id, str) or not isinstance(qr_url, str):
        raise ValueError('二维码返回格式异常')
    url = urlsplit(qr_url)
    if url.scheme != 'https' or not url.hostname or url.username or url.password or not any(url.hostname == host or url.hostname.endswith('.' + host) for host in ('xiaoyuzhoufm.com', 'xiaoyuzhou.fm')):
        raise ValueError('二维码地址无效')
    directory = Path.home() / '.personal-website'
    directory.mkdir(mode=0o700, exist_ok=True)
    qr_file = directory / 'xiaoyuzhou-login.svg'
    qr = qrcode.QRCode(border=4)
    qr.add_data(qr_url)
    qr.make(fit=True)
    qr.make_image(image_factory=SvgPathImage, attrib={'style': 'background:white'}).save(str(qr_file))
    try:
        webbrowser.open(qr_file.as_uri())
        print('已尝试在浏览器打开本机二维码。若未打开，请手动打开：' + str(qr_file))
        print('请用小宇宙 App 的扫一扫扫描，并在手机上确认登录（约 3 分钟有效）。')
        STAGE = '等待扫码确认'
        scanned = False
        for attempt in range(90):
            time.sleep(2)
            try:
                body, response_headers = post('login', {'id': qr_id})
            except urllib.error.HTTPError as error:
                if error.code == 401:
                    print('二维码已失效或登录未获接受。请重新运行工具，不会自动重试创建。')
                    return 1
                raise
            status = body.get('status')
            if status == 'SCANNED' and not scanned:
                print('已扫码，请在手机上确认登录。')
                scanned = True
            if status in ('CONFIRMED', 'USED'):
                cookies = {cookie.name: cookie.value for cookie in jar if cookie.domain.lstrip('.').endswith('xiaoyuzhoufm.com')}
                credentials = {'access_token': response_headers.get('x-jike-access-token') or cookies.get('x-jike-access-token'),
                               'refresh_token': response_headers.get('x-jike-refresh-token') or cookies.get('x-jike-refresh-token')}
                if not all(credentials.values()):
                    print('扫码已确认，但接口未提供完整授权令牌；未保存文件。')
                    return 1
                STAGE = '保存授权文件'
                save_credentials(credentials)
                return 0
        print('等待超时。请重新运行工具生成新二维码。')
        return 1
    finally:
        qr_file.unlink(missing_ok=True)


if __name__ == '__main__':
    try:
        sys.exit(main() or 0)
    except (KeyboardInterrupt, EOFError):
        print('已取消。', file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        print(safe_error(error), file=sys.stderr)
        sys.exit(1)
