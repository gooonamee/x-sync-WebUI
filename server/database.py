import sqlite3
import json
import os
from datetime import datetime

# 動態定位：以 server 目錄為基準，確保資料庫一律指向 [專案目錄]/server/data/x_sync.db
SERVER_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SERVER_DIR, '..'))
DB_PATH = os.path.join(SERVER_DIR, 'data', 'x_sync.db')

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = get_db()
    cursor = conn.cursor()
    
    # Tweets table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tweets (
        id TEXT PRIMARY KEY,
        source_type TEXT NOT NULL, -- 'bookmark', 'like', or 'bookmark,like'
        author_name TEXT NOT NULL,
        author_handle TEXT NOT NULL,
        author_avatar TEXT,
        created_at TEXT NOT NULL,
        content TEXT,
        lang TEXT DEFAULT 'zh',
        tweet_url TEXT,
        reply_count INTEGER DEFAULT 0,
        retweet_count INTEGER DEFAULT 0,
        favorite_count INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        bookmark_count INTEGER DEFAULT 0,
        has_media INTEGER DEFAULT 0,
        media_type TEXT DEFAULT 'none', -- 'none', 'photo', 'video'
        media_urls TEXT DEFAULT '[]',   -- JSON array
        local_media_paths TEXT DEFAULT '[]', -- JSON array
        synced_at TEXT NOT NULL
    )
    ''')
    
    # Tags table
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tags (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        color TEXT DEFAULT '#1D9BF0'
    )
    ''')
    
    # Tweet-Tag mapping
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS tweet_tags (
        tweet_id TEXT NOT NULL,
        tag_name TEXT NOT NULL,
        PRIMARY KEY (tweet_id, tag_name),
        FOREIGN KEY (tweet_id) REFERENCES tweets (id) ON DELETE CASCADE
    )
    ''')
    
    # Sync logs
    cursor.execute('''
    CREATE TABLE IF NOT EXISTS sync_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sync_type TEXT NOT NULL, -- 'bookmark' or 'like'
        count_added INTEGER DEFAULT 0,
        count_updated INTEGER DEFAULT 0,
        timestamp TEXT NOT NULL,
        status TEXT DEFAULT 'success',
        details TEXT
    )
    ''')
    
    conn.commit()
    conn.close()

def seed_sample_data():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM tweets')
    count = cursor.fetchone()[0]
    
    if count == 0:
        now = datetime.now().isoformat()
        sample_tweets = [
            {
                "id": "1837829100000000001",
                "source_type": "bookmark",
                "author_name": "serein",
                "author_handle": "@sereinworld",
                "author_avatar": "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80",
                "created_at": "2026-09-22T14:30:00",
                "content": "原来这个提示词\n\n还挺懂我的\n\n这种拼图的图片确实\n比单独生出的好看",
                "lang": "zh",
                "tweet_url": "https://x.com/sereinworld/status/1837829100000000001",
                "reply_count": 33,
                "retweet_count": 9,
                "favorite_count": 126,
                "view_count": 7573,
                "bookmark_count": 92,
                "has_media": 1,
                "media_type": "photo",
                "media_urls": json.dumps([
                    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=600&q=80",
                    "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80"
                ]),
                "local_media_paths": "[]",
                "synced_at": now,
                "tags": ["AI生圖", "提示詞"]
            },
            {
                "id": "1837829100000000002",
                "source_type": "bookmark",
                "author_name": "张禹",
                "author_handle": "@zyailive",
                "author_avatar": "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80",
                "created_at": "2026-09-22T16:15:00",
                "content": "做SaaS网站简单，但是苦于宣传视频难倒我了，每每看到其他竞品发布的宣传视频都能惊艳到我，想花钱找人做吧！又太贵，对于个人来说完全消费不起。\n\n今天看到Pexo平台可以用对话自动生成宣传视频，再去看看订阅价格，呦，这价格才 $30，我完全可以接受呀！\n\n啥也不说了，开肝，先看下成品吧！看看有没有惊艳到你们！",
                "lang": "zh",
                "tweet_url": "https://x.com/zyailive/status/1837829100000000002",
                "reply_count": 30,
                "retweet_count": 7,
                "favorite_count": 26,
                "view_count": 2503,
                "bookmark_count": 30,
                "has_media": 1,
                "media_type": "video",
                "media_urls": json.dumps([
                    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80"
                ]),
                "local_media_paths": "[]",
                "synced_at": now,
                "tags": ["SaaS", "視頻工具"]
            },
            {
                "id": "1837829100000000003",
                "source_type": "like",
                "author_name": "Alex Finn",
                "author_handle": "@alex_finn",
                "author_avatar": "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&h=120&q=80",
                "created_at": "2026-09-21T09:10:00",
                "content": "Building in public isn't just about sharing your MRR. It's about documenting the friction, the bugs you spent 14 hours fixing, and the design decisions that shaped the product.",
                "lang": "en",
                "tweet_url": "https://x.com/alex_finn/status/1837829100000000003",
                "reply_count": 45,
                "retweet_count": 88,
                "favorite_count": 920,
                "view_count": 34200,
                "bookmark_count": 412,
                "has_media": 0,
                "media_type": "none",
                "media_urls": "[]",
                "local_media_paths": "[]",
                "synced_at": now,
                "tags": ["IndieHacker", "Thinking"]
            }
        ]
        
        for t in sample_tweets:
            cursor.execute('''
            INSERT INTO tweets (id, source_type, author_name, author_handle, author_avatar,
                               created_at, content, lang, tweet_url, reply_count, retweet_count,
                               favorite_count, view_count, bookmark_count, has_media, media_type,
                               media_urls, local_media_paths, synced_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ''', (t["id"], t["source_type"], t["author_name"], t["author_handle"], t["author_avatar"],
                  t["created_at"], t["content"], t["lang"], t["tweet_url"], t["reply_count"],
                  t["retweet_count"], t["favorite_count"], t["view_count"], t["bookmark_count"],
                  t["has_media"], t["media_type"], t["media_urls"], t["local_media_paths"], t["synced_at"]))
            
            for tag in t.get("tags", []):
                cursor.execute('INSERT OR IGNORE INTO tags (name) VALUES (?)', (tag,))
                cursor.execute('INSERT OR IGNORE INTO tweet_tags (tweet_id, tag_name) VALUES (?, ?)', (t["id"], tag))
                
        cursor.execute('''
        INSERT INTO sync_history (sync_type, count_added, count_updated, timestamp, status, details)
        VALUES ('bookmark', 2, 0, ?, 'success', '初始導入書籤')
        ''', (now,))
        cursor.execute('''
        INSERT INTO sync_history (sync_type, count_added, count_updated, timestamp, status, details)
        VALUES ('like', 1, 0, ?, 'success', '初始導入點讚')
        ''', (now,))
        
        conn.commit()
    conn.close()

if __name__ == '__main__':
    init_db()
    seed_sample_data()
    print("Database initialized and sample data seeded successfully.")
