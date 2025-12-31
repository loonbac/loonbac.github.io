"""
Video Downloader API - Endpoints to add to api_public.py
=========================================================
Add these endpoints to your existing api_public.py file on your VPS.

Requirements:
    pip install yt-dlp

Usage:
    GET /api/video/info?url=<video_url>     - Get video metadata
    GET /api/video/download?url=<url>&format=<format_id>  - Download video
"""

# ==================== ADD THESE IMPORTS AT THE TOP OF api_public.py ====================
# import yt_dlp
# import tempfile
# import re
# from flask import Response, stream_with_context

# ==================== ADD THESE ENDPOINTS TO api_public.py ====================

# Video downloader configuration
YDL_OPTIONS = {
    'quiet': True,
    'no_warnings': True,
    'extract_flat': False,
    'format': 'best[ext=mp4]/best',
    'noplaylist': True,
}


def sanitize_filename(title):
    """Sanitize filename for download."""
    if not title:
        return 'video'
    # Remove invalid characters
    title = re.sub(r'[<>:"/\\|?*]', '', title)
    # Limit length
    return title[:100].strip() or 'video'


@app.route('/api/video/info', methods=['GET'])
def get_video_info():
    """Get video information from URL."""
    from flask import request
    import yt_dlp
    
    url = request.args.get('url')
    
    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400
    
    try:
        ydl_opts = {
            **YDL_OPTIONS,
            'skip_download': True,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            
            if not info:
                return jsonify({'error': 'Could not extract video info'}), 400
            
            # Get available formats
            formats = []
            if 'formats' in info:
                for f in info['formats']:
                    if f.get('vcodec') != 'none':  # Only video formats
                        formats.append({
                            'format_id': f.get('format_id'),
                            'quality': f.get('format_note') or f.get('height', 'N/A'),
                            'ext': f.get('ext', 'mp4'),
                            'filesize': f.get('filesize') or f.get('filesize_approx'),
                            'resolution': f'{f.get("width", "?")}x{f.get("height", "?")}' if f.get('height') else None
                        })
            
            # Sort by quality (prefer higher resolution)
            formats.sort(key=lambda x: int(x.get('quality', 0)) if str(x.get('quality', '')).isdigit() else 0, reverse=True)
            
            # Get best available formats (limit to 5)
            formats = formats[:5] if formats else [{'format_id': 'best', 'quality': 'Best', 'ext': 'mp4'}]
            
            return jsonify({
                'title': info.get('title', 'Unknown'),
                'thumbnail': info.get('thumbnail'),
                'duration': info.get('duration', 0),
                'uploader': info.get('uploader') or info.get('channel'),
                'description': (info.get('description') or '')[:200],
                'formats': formats,
                'platform': info.get('extractor', 'unknown').lower()
            })
            
    except yt_dlp.DownloadError as e:
        error_msg = str(e)
        if 'Unsupported URL' in error_msg:
            return jsonify({'error': 'URL not supported'}), 400
        return jsonify({'error': f'Download error: {error_msg[:100]}'}), 400
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)[:100]}'}), 500


@app.route('/api/video/download', methods=['GET'])
def download_video():
    """Download video and stream to client."""
    from flask import request, Response, stream_with_context, send_file
    import yt_dlp
    import tempfile
    import os
    
    url = request.args.get('url')
    format_id = request.args.get('format', 'best')
    
    if not url:
        return jsonify({'error': 'URL parameter is required'}), 400
    
    try:
        # Create temp directory
        temp_dir = tempfile.mkdtemp()
        output_template = os.path.join(temp_dir, '%(title)s.%(ext)s')
        
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'format': f'{format_id}[ext=mp4]/{format_id}/best[ext=mp4]/best',
            'outtmpl': output_template,
            'noplaylist': True,
            'merge_output_format': 'mp4',
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=True)
            
            if not info:
                return jsonify({'error': 'Could not download video'}), 400
            
            # Find downloaded file
            downloaded_file = None
            for file in os.listdir(temp_dir):
                if file.endswith(('.mp4', '.webm', '.mkv')):
                    downloaded_file = os.path.join(temp_dir, file)
                    break
            
            if not downloaded_file or not os.path.exists(downloaded_file):
                return jsonify({'error': 'Downloaded file not found'}), 500
            
            # Get filename
            title = sanitize_filename(info.get('title', 'video'))
            ext = os.path.splitext(downloaded_file)[1] or '.mp4'
            filename = f"{title}{ext}"
            
            # Send file and cleanup after
            def generate():
                try:
                    with open(downloaded_file, 'rb') as f:
                        while True:
                            chunk = f.read(8192)
                            if not chunk:
                                break
                            yield chunk
                finally:
                    # Cleanup temp files
                    try:
                        import shutil
                        shutil.rmtree(temp_dir, ignore_errors=True)
                    except:
                        pass
            
            response = Response(
                stream_with_context(generate()),
                mimetype='video/mp4',
                headers={
                    'Content-Disposition': f'attachment; filename="{filename}"',
                    'Content-Type': 'video/mp4'
                }
            )
            return response
            
    except yt_dlp.DownloadError as e:
        return jsonify({'error': f'Download error: {str(e)[:100]}'}), 400
    except Exception as e:
        return jsonify({'error': f'Error: {str(e)[:100]}'}), 500


# ==================== UPDATE YOUR INDEX ROUTE ====================
# Update the index route to include the new endpoints:

"""
@app.route('/', methods=['GET'])
def index():
    return jsonify({
        'name': 'Card Collection + Video Downloader API',
        'version': '2.0.0',
        'mode': 'PUBLIC',
        'endpoints': {
            'GET /api/coleccion': 'Get all cards',
            'GET /api/stats': 'Get collection stats',
            'GET /cartas/:filename': 'Get card image',
            'GET /api/video/info?url=': 'Get video info',
            'GET /api/video/download?url=&format=': 'Download video',
            'GET /health': 'Health check'
        }
    })
"""
