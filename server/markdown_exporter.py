import io
import zipfile
import json
from datetime import datetime

def tweet_to_markdown(tweet, tags=None, use_local_media=False):
    tags = tags or []
    media_urls = json.loads(tweet.get("media_urls", "[]") or "[]")
    local_paths = json.loads(tweet.get("local_media_paths", "[]") or "[]")
    
    # Format tags for YAML
    tags_yaml = "\n".join([f'  - "{t}"' for t in tags]) if tags else "  []"
    
    # Frontmatter
    md = [
        "---",
        f'id: "{tweet.get("id", "")}"',
        f'author: "{tweet.get("author_name", "")} ({tweet.get("author_handle", "")})"',
        f'date: "{tweet.get("created_at", "")}"',
        f'url: "{tweet.get("tweet_url", "")}"',
        f'source: "{tweet.get("source_type", "bookmark")}"',
        "stats:",
        f'  replies: {tweet.get("reply_count", 0)}',
        f'  retweets: {tweet.get("retweet_count", 0)}',
        f'  likes: {tweet.get("favorite_count", 0)}',
        f'  views: {tweet.get("view_count", 0)}',
        f'  bookmarks: {tweet.get("bookmark_count", 0)}',
        "tags:",
        tags_yaml,
        "---",
        "",
        f'# {tweet.get("author_name", "")} ({tweet.get("author_handle", "")})',
        "",
        tweet.get("content", "").strip(),
        ""
    ]
    
    # Media attachments
    if media_urls:
        md.append("### 媒體附檔")
        for i, url in enumerate(media_urls, 1):
            if use_local_media and i <= len(local_paths) and local_paths[i-1]:
                md.append(f"![媒體 {i}](./media/{local_paths[i-1]})")
            else:
                md.append(f"![媒體 {i}]({url})")
        md.append("")
        
    md.extend([
        "---",
        f'> 原始連結: [{tweet.get("tweet_url", "")}]({tweet.get("tweet_url", "")}) | 由 X sync 同步',
        ""
    ])
    
    return "\n".join(md)

def export_combined_markdown(tweets_with_tags):
    now = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    out = [
        f"# X sync 推文歸檔匯總",
        f"*匯出時間: {now} | 總計筆數: {len(tweets_with_tags)}*",
        "",
        "---",
        ""
    ]
    for item in tweets_with_tags:
        tweet = item["tweet"]
        tags = item.get("tags", [])
        out.append(tweet_to_markdown(tweet, tags))
        out.append("\n---\n")
    return "\n".join(out)

def export_zip_markdown(tweets_with_tags, media_dir=None):
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for item in tweets_with_tags:
            tweet = item["tweet"]
            tags = item.get("tags", [])
            
            # Safe filename: YYYYMMDD_author_id.md
            date_str = tweet.get("created_at", "").replace("-", "")[:8] or "00000000"
            author = tweet.get("author_handle", "@user").replace("@", "")
            tweet_id = tweet.get("id", "0")
            filename = f"{date_str}_{author}_{tweet_id}.md"
            
            content = tweet_to_markdown(tweet, tags)
            zip_file.writestr(filename, content.encode("utf-8"))
            
    zip_buffer.seek(0)
    return zip_buffer.getvalue()
