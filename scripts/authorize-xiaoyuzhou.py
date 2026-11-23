"""Run locally with Python 3. Credentials are never printed or sent to GitHub."""
import getpass
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


def main():
    global STAGE
    print('授权工具 v2 · 仅在首次登录时请求短信')
    print('小宇宙账号授权：手机号和验证码只发送到小宇宙官方域名。')
    print('本次仅登录已有账号。若提示需注册或验证码校验，请在官方客户端处理后再继续。')
    phone = input('请输入已有小宇宙账号手机号：').strip()
    if not phone.isdigit() or len(phone) != 11:
        raise ValueError('请输入正确的中国大陆手机号。')
    STAGE = '发送验证码'
    print('正在请求发送验证码，请稍候…')
    sent, _ = xyz.request(xyz.AUTH, '/v1/auth/send-code', {'mobilePhoneNumber': phone, 'areaCode': '+86'})
    if sent.get('success') is False or sent.get('code', 0) not in (0, 200, '0', '200', None):
        print('[发送验证码] API_REJECTED：接口未接受请求；请勿连续重试。', file=sys.stderr)
        return 1
    print('接口已返回，短信是否送达以手机实际接收为准。')
    STAGE = '校验验证码'
    code = getpass.getpass('请输入短信验证码（隐藏输入）：').strip()
    body, headers = xyz.request(xyz.AUTH, '/v1/auth/login-with-sms', {'mobilePhoneNumber': phone, 'areaCode': '+86', 'verifyCode': code})
    credentials = {'access_token': headers.get('x-jike-access-token'), 'refresh_token': headers.get('x-jike-refresh-token')}
    if not all(credentials.values()):
        raise ValueError('未获得有效授权，请在官方客户端确认账号后重试。')
    STAGE = '保存授权文件'
    directory = Path.home() / '.personal-website'
    directory.mkdir(mode=0o700, exist_ok=True)
    target = directory / 'xiaoyuzhou-token.json'
    fd = os.open(target, os.O_WRONLY | os.O_CREAT | os.O_TRUNC, 0o600)
    with os.fdopen(fd, 'w', encoding='utf-8') as file:
        json.dump(credentials, file)
    print('授权文件已保存到：' + str(target))
    print('将该文件内容填入仓库 Actions Secret：XIAOYUZHOU_TOKEN_JSON。不要发到聊天或上传到公开仓库。')


if __name__ == '__main__':
    try:
        sys.exit(main() or 0)
    except (KeyboardInterrupt, EOFError):
        print('已取消。', file=sys.stderr)
        sys.exit(1)
    except Exception as error:
        print(safe_error(error), file=sys.stderr)
        sys.exit(1)
