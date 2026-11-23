import importlib.util
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location("sync_weread", Path(__file__).parents[1] / "scripts/sync-weread.py")
sync = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sync)


class PublicBooksTest(unittest.TestCase):
    def test_privacy_and_allowed_fields(self):
        data = {"books": [
            {"bookId": "1", "title": "公开书", "secret": 0, "finishReading": 1, "notes": "不公开", "vid": "private-id"},
            {"bookId": "2", "title": "私密书", "secret": 1},
            {"bookId": "3", "title": "未知权限"},
        ]}
        books = sync.public_books(data)
        self.assertEqual([b["title"] for b in books], ["公开书"])
        self.assertEqual(books[0]["status"], "read")
        self.assertNotIn("notes", books[0])
        self.assertNotIn("vid", books[0])

    def test_status_does_not_invent_wishlist(self):
        books = sync.public_books({"data": {"books": [
            {"bookId": "1", "title": "在读", "secret": 0, "readUpdateTime": 123},
            {"bookId": "2", "title": "仅收藏", "secret": 0},
        ]}})
        self.assertEqual([b["status"] for b in books], ["reading", "shelf"])

    def test_error_and_unexpected_payload_fail_closed(self):
        for payload in ({"errcode": -1, "books": []}, {"data": {}}, []):
            with self.assertRaises(ValueError):
                sync.public_books(payload)

    def test_urls_are_limited_to_platform(self):
        self.assertEqual(sync.safe_url("javascript:alert(1)"), "")
        self.assertEqual(sync.safe_url("https://evil.example/key", ("weread.qq.com",)), "")
        self.assertEqual(sync.safe_url("https://weread.qq.com@evil.example/", ("weread.qq.com",)), "")


if __name__ == "__main__":
    unittest.main()
