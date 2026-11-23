"""Run locally with Python 3. Credentials are never printed or sent to GitHub."""
import getpass
import importlib.util
import json
import os
from pathlib import Path
import sys

spec = importlib.util.spec_from_file_location('xyz', Path(__file__).with_name('xiaoyuzhou-client.py'))
xyz = importlib.util.module_from_spec(spec)
spec.loader.exec_module(xyz)


def main():
    print('小宇宙账号授权：手机号和验证码只发送到小宇宙官方域名。')
    print('本次仅登录已有账号。若提示需注册或验证码校验，请在官方客户端处理后再继续。')
    phone = input('请输入已有小宇宙账号手机号：').strip()
    if not phone.isdigit() or len(phone) != 11:
        raise ValueError('请输入正确的中国大陆手机号。')
    xyz.request(xyz.AUTH, '/v1/auth/send-code', {'mobilePhoneNumber': phone, 'areaCode': '+86'})
    code = getpass.getpass('请输入短信验证码（隐藏输入）：').strip()
    body, headers = xyz.request(xyz.AUTH, '/v1/auth/login-with-sms', {'mobilePhoneNumber': phone, 'areaCode': '+86', 'verifyCode': code})
    credentials = {'access_token': headers.get('x-jike-access-token'), 'refresh_token': headers.get('x-jike-refresh-token')}
    if not all(credentials.values()):
        raise ValueError('未获得有效授权，请在官方客户端确认账号后重试。')
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
        main()
    except (KeyboardInterrupt, EOFError):
        print('已取消。', file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('授权未完成。请检查手机号、验证码或网络；未输出任何凭据。', file=sys.stderr)
        sys.exit(1)
