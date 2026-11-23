"""Publish an allowlisted, non-private bookshelf; never persist the API response."""
import json
import os
import sys
import urllib.request
from pathlib import Path
from urllib.parse import urlsplit

ROOT = Path(__file__).resolve().parents[1]


def safe_url(value, hosts=None):
    if not isinstance(value, str):
        return ""
    try:
        url = urlsplit(value)
        if url.scheme != "https" or not url.hostname or url.username or url.password:
            return ""
        if hosts and not any(url.hostname == h or url.hostname.endswith("." + h) for h in hosts):
            return ""
        return value
    except ValueError:
        return ""


def public_books(payload):
    # Gateway deployments may wrap the documented response in data/result.
    for _ in range(4):
        if not isinstance(payload, dict):
            raise ValueError("书架返回格式无效；已保留上次数据。")
        if payload.get("errcode", 0) not in (0, "0", None):
            raise ValueError("微信读书授权或请求失败；请检查 Secret 中的密钥是否有效。")
        if isinstance(payload.get("books"), list):
            break
        payload = payload.get("data", payload.get("result"))
    else:
        raise ValueError("未找到书目列表；已保留上次数据。")
    result, seen = [], set()
    for book in payload["books"]:
        # Missing privacy metadata is not treated as public.
        if not isinstance(book, dict) or str(book.get("secret")) != "0":
            continue
        book_id = str(book.get("bookId", ""))
        title = book.get("title")
        if not book_id or book_id in seen or not isinstance(title, str) or not title.strip():
            continue
        seen.add(book_id)
        status = "read" if str(book.get("finishReading")) == "1" else (
            "reading" if float(book.get("readUpdateTime") or 0) > 0 else "shelf")
        result.append({
            "id": "weread-" + book_id,
            "title": title.strip(),
            "author": book.get("author") if isinstance(book.get("author"), str) else "",
            "cover": safe_url(book.get("cover"), ("qq.com", "qpic.cn", "gtimg.com")),
            "url": safe_url(book.get("readerLink"), ("weread.qq.com",)) or safe_url(book.get("deepLink"), ("weread.qq.com",)),
            "status": status,
            "tone": ("cream", "sage", "clay", "blue")[len(result) % 4],
            "source": "微信读书",
        })
    return result


def main():
    key = os.environ.get("WEREAD_API_KEY", "").strip()
    if not key:
        raise ValueError("缺少 WEREAD_API_KEY，请在仓库 Actions Secrets 中配置。")
    request = urllib.request.Request(
        "https://i.weread.qq.com/api/agent/gateway",
        data=json.dumps({"api_name": "/shelf/sync", "skill_version": "1.0.6"}).encode(),
        headers={"Authorization": "Bearer " + key, "Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(request, timeout=60) as response:
        books = public_books(json.load(response))
    # Only these public fields reach Git or artifacts. No notes, account IDs,
    # raw API payloads, private books, archives, timestamps or reading durations.
    target = ROOT / "data/books.js"
    target.parent.mkdir(exist_ok=True)
    target.write_text("// 非私密书目；由官方微信读书接口同步。\nwindow.wereadBooks = " + json.dumps(books, ensure_ascii=False, indent=2) + ";\n", encoding="utf-8")
    print(f"已同步 {len(books)} 本非私密书目（不含有声书、文章收藏与笔记）。")


if __name__ == "__main__":
    try:
        main()
    except ValueError as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)
    except Exception:
        # Never print HTTP response bodies, headers or credentials.
        print("微信读书暂时无法连接，未修改上次同步结果。", file=sys.stderr)
        sys.exit(1)
