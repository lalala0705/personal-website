"""Read explicitly selected public Pi Travel journeys; publish itinerary fields only."""
from datetime import datetime, timedelta, timezone
import json
from pathlib import Path
import re
import sys
import urllib.request

ROOT = Path(__file__).resolve().parents[1]
CN_TZ = timezone(timedelta(hours=8))


def local_date(timestamp):
    if not isinstance(timestamp, (int, float)) or isinstance(timestamp, bool):
        raise ValueError('行程日期无效。')
    return datetime.fromtimestamp(timestamp / 1000, CN_TZ).date().isoformat()


def plain(value):
    return value.strip() if isinstance(value, str) else ''


def time_text(value):
    value = plain(value)
    if value and not re.fullmatch(r'(?:[01]\d|2[0-3]):[0-5]\d', value):
        raise ValueError('行程时间格式已变化；保留上次数据。')
    return value


def public_itinerary(payload, source):
    if not isinstance(payload, dict) or payload.get('success') is not True or payload.get('code') not in (0, '0'):
        raise ValueError('行程不可读取，可能已取消分享；保留上次数据。')
    journey = payload.get('data', {}).get('journey')
    if not isinstance(journey, dict) or not plain(journey.get('name')):
        raise ValueError('行程结构无效；保留上次数据。')
    if local_date(journey.get('start_time')) != source['startDate'] or local_date(journey.get('end_time')) != source['endDate']:
        raise ValueError('源行程日期与网站旅程不一致；保留上次数据。')
    days = []
    for raw_day in journey.get('day_plans', []):
        raw_events = raw_day.get('events', [])
        if not raw_events:
            continue  # Skip the platform's empty “待计划” bucket.
        date = local_date(raw_day.get('timestamp'))
        if not source['startDate'] <= date <= source['endDate']:
            raise ValueError('每日安排超出旅程日期。')
        events = []
        for event in raw_events:
            title = plain(event.get('name'))
            if not title:
                raise ValueError('有未命名安排；保留上次数据。')
            events.append({'title': title, 'start': time_text(event.get('start_time')),
                           'end': time_text(event.get('end_time')), 'note': plain(event.get('note'))})
        days.append({'date': date, 'events': events})
    days.sort(key=lambda day: day['date'])
    if not days or len({day['date'] for day in days}) != len(days):
        raise ValueError('每日安排缺失或重复；保留上次数据。')
    return {'title': plain(journey['name']), 'source': '圆周旅迹',
            'sourceUrl': 'https://www.pitravel.cn/web/journey/detail/' + source['journeyId'],
            'days': days}


def fetch(source):
    journey_id = source['journeyId']
    if not isinstance(journey_id, str) or not re.fullmatch(r'\d{10,24}', journey_id):
        raise ValueError('分享行程 ID 格式无效。')
    url = 'https://www.pitravel.cn/api/slytherin/v1/web/journey/detail?journey_id=' + journey_id
    request = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0', 'Referer': 'https://www.pitravel.cn/'})
    with urllib.request.urlopen(request, timeout=30) as response:
        data = response.read(2_000_001)
        if len(data) > 2_000_000:
            raise ValueError('行程数据过大，未发布。')
        return public_itinerary(json.loads(data), source)


def main():
    sources = json.loads((ROOT / 'data/pitravel-sources.json').read_text())
    imported = {}
    for source in sources:
        trip_id = source['tripId']
        if not re.fullmatch(r'[a-z0-9-]+', trip_id) or trip_id in imported:
            raise ValueError('网站旅程 ID 无效或重复。')
        imported[trip_id] = fetch(source)
    if not imported:
        raise ValueError('未选择任何行程。')
    # No account identifiers, members, raw responses, images, hotel orders,
    # ticket details or unconfirmed map markers are persisted.
    target = ROOT / 'data/pitravel.js'
    target.write_text('// 用户指定公开分享行程；仅同步计划日期、安排与备注。\nwindow.pitravelJourneys = ' + json.dumps(imported, ensure_ascii=False, indent=2) + ';\n', encoding='utf-8')
    count = sum(len(day['events']) for plan in imported.values() for day in plan['days'])
    print(f'已同步 {len(imported)} 段行程、{count} 条安排。')


if __name__ == '__main__':
    try:
        main()
    except ValueError as error:
        print('行程同步未完成，源数据或日期校验未通过；保留上次成功数据。', file=sys.stderr)
        sys.exit(1)
    except Exception:
        print('行程暂时无法读取；保留上次成功数据。', file=sys.stderr)
        sys.exit(1)
