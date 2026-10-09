#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
import urllib.parse
import urllib.request
import sqlite3
import hashlib
from datetime import datetime, timedelta

from database import get_db, init_db, seed_sample_data, DB_PATH
from markdown_exporter import export_combined_markdown, export_zip_markdown

PORT = int(os.environ.get("PORT", 8765))
WEB_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'web'))
MEDIA_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), 'data', 'media'))

os.makedirs(MEDIA_DIR, exist_ok=True)

class XSyncHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WEB_DIR, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def parse_post_json(self):
        content_len = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_len)
        try:
            return json.loads(post_body.decode('utf-8'))
        except Exception:
            return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        # Static media files: /media/<filename>
        if path.startswith('/media/'):
            filename = os.path.basename(path)
            file_path = os.path.join(MEDIA_DIR, filename)
            if os.path.exists(file_path):
                self.send_response(200)
                if filename.endswith('.jpg') or filename.endswith('.jpeg'):
                    self.send_header('Content-Type', 'image/jpeg')
                elif filename.endswith('.png'):
                    self.send_header('Content-Type', 'image/png')
                elif filename.endswith('.mp4'):
                    self.send_header('Content-Type', 'video/mp4')
                else:
                    self.send_header('Content-Type', 'application/octet-stream')
                self.send_header('Content-Length', str(os.path.getsize(file_path)))
                self.end_headers()
                with open(file_path, 'rb') as f:
                    self.wfile.write(f.read())
                return
            else:
                self.send_response(404)
                self.end_headers()
                return

        # API Endpoints
        if path == '/api/stats':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM tweets WHERE source_type LIKE '%bookmark%'")
            bookmark_count = cursor.fetchone()[0]
            cursor.execute("SELECT COUNT(*) FROM tweets WHERE source_type LIKE '%like%'")
            like_count = cursor.fetchone()[0]
            cursor.execute("SELECT timestamp FROM sync_history ORDER BY id DESC LIMIT 1")
            last_sync_row = cursor.fetchone()
            last_sync = last_sync_row[0] if last_sync_row else None
            conn.close()
            self.send_json({
                "bookmark_count": bookmark_count,
                "like_count": like_count,
                "last_sync": last_sync
            })
            return

        elif path == '/api/video/stream':
            query = urllib.parse.parse_qs(parsed.query)
            target_url = query.get('url', [''])[0]
            if not target_url:
                self.send_response(400)
                self.end_headers()
                return

            try:
                headers = {
                    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
                    'Referer': 'https://x.com/'
                }
                range_header = self.headers.get('Range')
                if range_header:
                    headers['Range'] = range_header

                req = urllib.request.Request(target_url, headers=headers)
                with urllib.request.urlopen(req, timeout=12) as resp:
                    status_code = resp.status
                    self.send_response(status_code)
                    for h in ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges']:
                        val = resp.headers.get(h)
                        if val:
                            self.send_header(h, val)
                    self.end_headers()

                    while True:
                        chunk = resp.read(64 * 1024)
                        if not chunk:
                            break
                        self.wfile.write(chunk)
                return
            except Exception as e:
                self.send_response(500)
                self.end_headers()
                return

        elif path == '/api/video/resolve':
            query = urllib.parse.parse_qs(parsed.query)
            tweet_id = query.get('id', [''])[0]
            author_handle = query.get('handle', [''])[0].replace('@', '')
            if not tweet_id:
                self.send_json({"status": "error", "message": "Missing tweet id"}, status=400)
                return

            video_url = None
            thumb_url = None

            # Source 1: FxEmbed v2 API
            try:
                fx_url = f"https://api.fxtwitter.com/2/status/{tweet_id}"
                req = urllib.request.Request(fx_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=6) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        tweet_data = data.get('tweet', {})
                        media = tweet_data.get('media', {})
                        videos = media.get('videos', [])
                        if videos and len(videos) > 0:
                            video_url = videos[0].get('url')
                            thumb_url = videos[0].get('thumbnail_url')
            except Exception:
                pass

            # Source 2: FxTwitter handle endpoint
            if not video_url and author_handle:
                try:
                    fx_url = f"https://api.fxtwitter.com/{author_handle}/status/{tweet_id}"
                    req = urllib.request.Request(fx_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode('utf-8'))
                            media = data.get('tweet', {}).get('media', {})
                            videos = media.get('videos', [])
                            if videos and len(videos) > 0:
                                video_url = videos[0].get('url')
                                thumb_url = videos[0].get('thumbnail_url')
                except Exception:
                    pass

            # Source 3: VxTwitter API
            if not video_url:
                try:
                    vx_url = f"https://api.vxtwitter.com/Twitter/status/{tweet_id}"
                    req = urllib.request.Request(vx_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode('utf-8'))
                            video_url = data.get('video_url')
                            if not video_url:
                                media_urls = data.get('mediaURLs', [])
                                for u in media_urls:
                                    if '.mp4' in u or 'video' in u:
                                        video_url = u
                                        break
                except Exception:
                    pass

            # Source 4: Syndication API fallback
            if not video_url:
                try:
                    syn_url = f"https://cdn.syndication.twimg.com/tweet-result?id={tweet_id}&token=5"
                    req = urllib.request.Request(syn_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode('utf-8'))
                            media_details = data.get('mediaDetails', [])
                            for m in media_details:
                                if m.get('type') == 'video':
                                    variants = m.get('video_info', {}).get('variants', [])
                                    mp4s = [v for v in variants if v.get('content_type') == 'video/mp4']
                                    if mp4s:
                                        mp4s.sort(key=lambda x: x.get('bitrate', 0), reverse=True)
                                        video_url = mp4s[0].get('url')
                                        thumb_url = m.get('media_url_https')
                                        break
                except Exception:
                    pass

            if video_url:
                proxied_url = f"/api/video/stream?url=" + urllib.parse.quote(video_url)
                self.send_json({
                    "status": "success",
                    "video_url": video_url,
                    "proxied_url": proxied_url,
                    "thumbnail_url": thumb_url
                })
            else:
                self.send_json({
                    "status": "error",
                    "message": "Video stream not found"
                }, status=404)
            return

            video_url = None
            thumb_url = None

            # 1. Try fxtwitter API
            try:
                fx_url = f"https://api.fxtwitter.com/i/status/{tweet_id}"
                req = urllib.request.Request(fx_url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
                with urllib.request.urlopen(req, timeout=5) as resp:
                    if resp.status == 200:
                        data = json.loads(resp.read().decode('utf-8'))
                        media = data.get('tweet', {}).get('media', {})
                        videos = media.get('videos', [])
                        if videos and len(videos) > 0:
                            video_url = videos[0].get('url')
                            thumb_url = videos[0].get('thumbnail_url')
            except Exception:
                pass

            # 2. Try syndication API
            if not video_url:
                try:
                    syn_url = f"https://cdn.syndication.twimg.com/tweet-result?id={tweet_id}&token=!"
                    req = urllib.request.Request(syn_url, headers={'User-Agent': 'Mozilla/5.0'})
                    with urllib.request.urlopen(req, timeout=5) as resp:
                        if resp.status == 200:
                            data = json.loads(resp.read().decode('utf-8'))
                            media_details = data.get('mediaDetails', [])
                            for m in media_details:
                                if m.get('type') == 'video':
                                    variants = m.get('video_info', {}).get('variants', [])
                                    mp4s = [v for v in variants if v.get('content_type') == 'video/mp4']
                                    if mp4s:
                                        mp4s.sort(key=lambda x: x.get('bitrate', 0), reverse=True)
                                        video_url = mp4s[0].get('url')
                                        thumb_url = m.get('media_url_https')
                                        break
                except Exception:
                    pass

            if video_url:
                self.send_json({
                    "status": "success",
                    "video_url": video_url,
                    "thumbnail_url": thumb_url
                })
            else:
                self.send_json({
                    "status": "error",
                    "message": "Video stream not found"
                }, status=404)
            return

        elif path == '/api/tags':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute('''
                SELECT t.name, t.color, COUNT(tt.tweet_id) as count
                FROM tags t
                LEFT JOIN tweet_tags tt ON t.name = tt.tag_name
                GROUP BY t.name
                ORDER BY count DESC
            ''')
            tags = [{"name": row["name"], "color": row["color"], "count": row["count"]} for row in cursor.fetchall()]
            conn.close()
            self.send_json({"tags": tags})
            return

        elif path == '/api/history':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM sync_history ORDER BY id DESC LIMIT 50")
            history = [dict(row) for row in cursor.fetchall()]
            conn.close()
            self.send_json({"history": history})
            return

        elif path == '/api/existing-ids':
            conn = get_db()
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM tweets")
            ids = [row[0] for row in cursor.fetchall()]
            conn.close()
            self.send_json({"ids": ids, "total": len(ids)})
            return

        elif path == '/api/tweets':
            source_type = query.get('type', ['bookmark'])[0]
            keyword = query.get('q', [''])[0].strip()
            author = query.get('author', [''])[0].strip()
            media_type = query.get('media_type', ['all'])[0]
            lang = query.get('lang', ['all'])[0]
            time_range = query.get('time_range', ['all'])[0]
            tag = query.get('tag', ['all'])[0]
            sort_by = query.get('sort', ['time_desc'])[0]

            sql = "SELECT DISTINCT t.* FROM tweets t"
            params = []
            joins = []
            wheres = []

            # Filter by source_type
            if source_type != 'all':
                wheres.append("t.source_type LIKE ?")
                params.append(f"%{source_type}%")

            # Keyword filter (content or url)
            if keyword:
                wheres.append("(t.content LIKE ? OR t.tweet_url LIKE ?)")
                params.extend([f"%{keyword}%", f"%{keyword}%"])

            # Author filter (name or handle)
            if author:
                wheres.append("(t.author_name LIKE ? OR t.author_handle LIKE ?)")
                params.extend([f"%{author}%", f"%{author}%"])

            # Media type
            if media_type == 'photo':
                wheres.append("t.media_type = 'photo'")
            elif media_type == 'video':
                wheres.append("t.media_type = 'video'")
            elif media_type == 'text_only':
                wheres.append("t.has_media = 0")
            elif media_type == 'has_media':
                wheres.append("t.has_media = 1")

            # Language
            if lang != 'all':
                wheres.append("t.lang = ?")
                params.append(lang)

            # Time range
            now = datetime.now()
            if time_range == '7d':
                since = (now - timedelta(days=7)).isoformat()
                wheres.append("t.created_at >= ?")
                params.append(since)
            elif time_range == '30d':
                since = (now - timedelta(days=30)).isoformat()
                wheres.append("t.created_at >= ?")
                params.append(since)
            elif time_range == '1y':
                since = (now - timedelta(days=365)).isoformat()
                wheres.append("t.created_at >= ?")
                params.append(since)

            # Tag filter
            if tag == 'none' or tag == 'untagged':
                wheres.append("t.id NOT IN (SELECT tweet_id FROM tweet_tags)")
            elif tag != 'all':
                joins.append("JOIN tweet_tags tt ON t.id = tt.tweet_id")
                wheres.append("tt.tag_name = ?")
                params.append(tag)

            join_clause = " ".join(joins)
            where_clause = (" WHERE " + " AND ".join(wheres)) if wheres else ""
            full_sql = f"{sql} {join_clause} {where_clause} ORDER BY t.created_at DESC"

            conn = get_db()
            cursor = conn.cursor()
            cursor.execute(full_sql, params)
            tweets_rows = cursor.fetchall()

            # Pre-fetch all tag counts for single tag total sorting
            cursor.execute("SELECT tag_name, COUNT(tweet_id) FROM tweet_tags GROUP BY tag_name")
            tag_counts = dict(cursor.fetchall())

            result = []
            for row in tweets_rows:
                tweet_dict = dict(row)
                tweet_id = tweet_dict["id"]
                # Fetch tags for this tweet
                cursor.execute("SELECT tag_name FROM tweet_tags WHERE tweet_id = ?", (tweet_id,))
                tags = [r[0] for r in cursor.fetchall()]
                tweet_dict["tags"] = tags
                tweet_dict["media_urls"] = json.loads(tweet_dict.get("media_urls") or "[]")
                tweet_dict["local_media_paths"] = json.loads(tweet_dict.get("local_media_paths") or "[]")
                
                counts_for_tweet = [tag_counts.get(t, 0) for t in tags]
                tweet_dict["max_tag_count"] = max(counts_for_tweet, default=0)
                tweet_dict["min_tag_count"] = min(counts_for_tweet, default=0) if counts_for_tweet else 0
                result.append(tweet_dict)

            if sort_by == 'time_asc':
                result.sort(key=lambda x: x.get('created_at', ''))
            elif sort_by == 'time_desc':
                result.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            elif sort_by == 'tags_desc':
                # 單一標籤貼文總數最多排到最低
                result.sort(key=lambda x: (x.get('max_tag_count', 0), x.get('created_at', '')), reverse=True)
            elif sort_by == 'tags_asc':
                # 單一標籤貼文總數最低排到最高 (有標籤者依貼文數由小到大排，未標籤排在最後)
                result.sort(key=lambda x: (
                    1 if x.get('min_tag_count', 0) > 0 else 2,
                    x.get('min_tag_count', 0),
                    -datetime.fromisoformat(x.get('created_at', '')).timestamp() if 'T' in x.get('created_at', '') else 0
                ))

            conn.close()
            self.send_json({"tweets": result, "total": len(result)})
            return

        # Default static file fallback
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        if path == '/api/sync':
            payload = self.parse_post_json()
            sync_type = payload.get('type', 'bookmark')
            incoming_tweets = payload.get('tweets', [])
            download_media = payload.get('download_media', False)
            skip_existing = payload.get('skip_existing', False)

            if not incoming_tweets:
                self.send_json({"status": "error", "message": "No tweets provided"}, status=400)
                return

            conn = get_db()
            cursor = conn.cursor()
            now = datetime.now().isoformat()

            added_count = 0
            updated_count = 0
            skipped_count = 0

            for t in incoming_tweets:
                tweet_id = str(t.get('id'))
                cursor.execute("SELECT source_type, media_urls, local_media_paths FROM tweets WHERE id = ?", (tweet_id,))
                existing = cursor.fetchone()

                if existing and skip_existing:
                    skipped_count += 1
                    continue

                media_urls = t.get('media_urls', [])
                media_urls_json = json.dumps(media_urls)
                local_media_paths = []

                if download_media and media_urls:
                    for m_idx, m_url in enumerate(media_urls):
                        try:
                            ext = '.jpg'
                            if '.png' in m_url: ext = '.png'
                            elif '.mp4' in m_url: ext = '.mp4'
                            local_name = f"{tweet_id}_{m_idx}{ext}"
                            local_file = os.path.join(MEDIA_DIR, local_name)
                            if not os.path.exists(local_file):
                                req = urllib.request.Request(m_url, headers={'User-Agent': 'Mozilla/5.0'})
                                with urllib.request.urlopen(req, timeout=10) as resp, open(local_file, 'wb') as out_f:
                                    out_f.write(resp.read())
                            local_media_paths.append(local_name)
                        except Exception as e:
                            print(f"Error downloading media {m_url}: {e}")

                local_media_json = json.dumps(local_media_paths)

                if existing:
                    # Update source_type if new type added
                    cur_types = set(existing["source_type"].split(','))
                    cur_types.add(sync_type)
                    merged_type = ",".join(cur_types)

                    cursor.execute('''
                        UPDATE tweets SET
                            source_type = ?,
                            reply_count = ?,
                            retweet_count = ?,
                            favorite_count = ?,
                            view_count = ?,
                            bookmark_count = ?,
                            synced_at = ?
                        WHERE id = ?
                    ''', (merged_type, t.get('reply_count', 0), t.get('retweet_count', 0),
                          t.get('favorite_count', 0), t.get('view_count', 0),
                          t.get('bookmark_count', 0), now, tweet_id))
                    updated_count += 1
                else:
                    cursor.execute('''
                        INSERT INTO tweets (
                            id, source_type, author_name, author_handle, author_avatar,
                            created_at, content, lang, tweet_url, reply_count, retweet_count,
                            favorite_count, view_count, bookmark_count, has_media, media_type,
                            media_urls, local_media_paths, synced_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        tweet_id, sync_type, t.get('author_name', ''), t.get('author_handle', ''),
                        t.get('author_avatar', ''), t.get('created_at', now), t.get('content', ''),
                        t.get('lang', 'zh'), t.get('tweet_url', f"https://x.com/i/status/{tweet_id}"),
                        t.get('reply_count', 0), t.get('retweet_count', 0), t.get('favorite_count', 0),
                        t.get('view_count', 0), t.get('bookmark_count', 0),
                        1 if media_urls else 0, t.get('media_type', 'none'),
                        media_urls_json, local_media_json, now
                    ))
                    added_count += 1

                # Process initial tags if present
                for tag in t.get('tags', []):
                    cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag,))
                    cursor.execute("INSERT OR IGNORE INTO tweet_tags (tweet_id, tag_name) VALUES (?, ?)", (tweet_id, tag))

            # Record sync history
            log_detail = f"同步成功：新增 {added_count} 筆"
            if skipped_count > 0:
                log_detail += f"，略過已存在 {skipped_count} 筆"
            if updated_count > 0:
                log_detail += f"，更新 {updated_count} 筆"

            cursor.execute('''
                INSERT INTO sync_history (sync_type, count_added, count_updated, timestamp, status, details)
                VALUES (?, ?, ?, ?, 'success', ?)
            ''', (sync_type, added_count, updated_count, now, log_detail))

            conn.commit()
            conn.close()

            self.send_json({
                "status": "success",
                "added": added_count,
                "updated": updated_count,
                "skipped": skipped_count,
                "total_processed": len(incoming_tweets)
            })
            return

        elif path == '/api/batch/tags':
            payload = self.parse_post_json()
            tweet_ids = payload.get('ids', [])
            tag_name = payload.get('tag', '').strip()
            action = payload.get('action', 'add') # 'add' or 'remove'

            if not tag_name:
                self.send_json({"status": "error", "message": "Missing tag name"}, status=400)
                return

            conn = get_db()
            cursor = conn.cursor()
            if action == 'add':
                cursor.execute("INSERT OR IGNORE INTO tags (name) VALUES (?)", (tag_name,))
                for tid in tweet_ids:
                    cursor.execute("INSERT OR IGNORE INTO tweet_tags (tweet_id, tag_name) VALUES (?, ?)", (tid, tag_name))
            else:
                for tid in tweet_ids:
                    cursor.execute("DELETE FROM tweet_tags WHERE tweet_id = ? AND tag_name = ?", (tid, tag_name))
            conn.commit()
            conn.close()
            self.send_json({"status": "success", "modified": len(tweet_ids)})
            return

        elif path == '/api/tags/rename':
            payload = self.parse_post_json()
            old_name = payload.get('old_name', '').strip().lstrip('#')
            new_name = payload.get('new_name', '').strip().lstrip('#')

            if not old_name or not new_name:
                self.send_json({"status": "error", "message": "Missing old_name or new_name"}, status=400)
                return

            if old_name == new_name:
                self.send_json({"status": "success", "old_name": old_name, "new_name": new_name})
                return

            conn = get_db()
            cursor = conn.cursor()

            # Check if new_name already exists in tags (disallow renaming to an existing tag)
            cursor.execute("SELECT 1 FROM tags WHERE LOWER(name) = LOWER(?) AND LOWER(name) != LOWER(?)", (new_name, old_name))
            exists = cursor.fetchone()

            if exists:
                conn.close()
                self.send_json({"status": "error", "message": f"標籤「{new_name}」已存在，不能改名為已存在同名的標籤！"}, status=400)
                return

            cursor.execute("UPDATE tags SET name = ? WHERE name = ?", (new_name, old_name))
            cursor.execute("UPDATE tweet_tags SET tag_name = ? WHERE tag_name = ?", (new_name, old_name))
            conn.commit()
            conn.close()
            self.send_json({"status": "success", "old_name": old_name, "new_name": new_name})
            return

        elif path == '/api/tags/delete':
            payload = self.parse_post_json()
            tag_name = payload.get('name', '').strip().lstrip('#')

            if not tag_name:
                self.send_json({"status": "error", "message": "Missing tag name"}, status=400)
                return

            conn = get_db()
            cursor = conn.cursor()
            # Only remove mapping and tag definition. Tweets table is untouched.
            cursor.execute("DELETE FROM tweet_tags WHERE tag_name = ?", (tag_name,))
            cursor.execute("DELETE FROM tags WHERE name = ?", (tag_name,))
            conn.commit()
            conn.close()
            self.send_json({"status": "success", "deleted": tag_name})
            return

        elif path == '/api/batch/delete':
            payload = self.parse_post_json()
            tweet_ids = payload.get('ids', [])
            if not tweet_ids:
                self.send_json({"status": "error", "message": "No ids provided"}, status=400)
                return
            conn = get_db()
            cursor = conn.cursor()
            for tid in tweet_ids:
                cursor.execute("DELETE FROM tweets WHERE id = ?", (tid,))
                cursor.execute("DELETE FROM tweet_tags WHERE tweet_id = ?", (tid,))
            conn.commit()
            conn.close()
            self.send_json({"status": "success", "deleted": len(tweet_ids)})
            return

        elif path == '/api/export/markdown':
            payload = self.parse_post_json()
            tweet_ids = payload.get('ids', [])
            mode = payload.get('mode', 'combined') # 'combined' or 'zip'

            conn = get_db()
            cursor = conn.cursor()

            if tweet_ids and tweet_ids != ['all']:
                placeholders = ','.join(['?'] * len(tweet_ids))
                cursor.execute(f"SELECT * FROM tweets WHERE id IN ({placeholders}) ORDER BY created_at DESC", tweet_ids)
            else:
                cursor.execute("SELECT * FROM tweets ORDER BY created_at DESC")

            rows = cursor.fetchall()
            tweets_with_tags = []
            for row in rows:
                t_dict = dict(row)
                cursor.execute("SELECT tag_name FROM tweet_tags WHERE tweet_id = ?", (t_dict["id"],))
                tags = [r[0] for r in cursor.fetchall()]
                tweets_with_tags.append({"tweet": t_dict, "tags": tags})

            conn.close()

            if mode == 'zip':
                zip_bytes = export_zip_markdown(tweets_with_tags)
                self.send_response(200)
                self.send_header('Content-Type', 'application/zip')
                self.send_header('Content-Disposition', 'attachment; filename="x_sync_markdown_archive.zip"')
                self.send_header('Content-Length', str(len(zip_bytes)))
                self.end_headers()
                self.wfile.write(zip_bytes)
                return
            else:
                combined_md = export_combined_markdown(tweets_with_tags)
                self.send_json({
                    "status": "success",
                    "count": len(tweets_with_tags),
                    "markdown": combined_md
                })
                return

        elif path == '/api/discord/webhook':
            payload = self.parse_post_json()
            webhook_url = payload.get('webhook_url', '')
            embed_payload = payload.get('payload', {})

            if not webhook_url or not webhook_url.startswith(('https://discord.com/api/webhooks/', 'https://discordapp.com/api/webhooks/')):
                self.send_json({"status": "error", "message": "Invalid Discord Webhook URL"}, status=400)
                return

            req_data = json.dumps(embed_payload).encode('utf-8')
            req = urllib.request.Request(
                webhook_url,
                data=req_data,
                headers={'Content-Type': 'application/json', 'User-Agent': 'X-Sync/1.0'}
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    self.send_json({"status": "success", "code": resp.status})
            except Exception as e:
                self.send_json({"status": "error", "message": str(e)}, status=500)
            return

        self.send_response(404)
        self.end_headers()

def run_server():
    init_db()
    if os.environ.get("SEED_SAMPLE_DATA", "0") == "1":
        seed_sample_data()
    socketserver.TCPServer.allow_reuse_address = True
    host = "127.0.0.1"
    with socketserver.TCPServer((host, PORT), XSyncHandler) as httpd:
        print(f"==================================================")
        print(f"  X sync Local Server is running!")
        print(f"  Web Dashboard: http://localhost:{PORT}/")
        print(f"  API Endpoint:  http://localhost:{PORT}/api/")
        print(f"  Database:      {DB_PATH}")
        print(f"==================================================")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")

if __name__ == '__main__':
    run_server()
