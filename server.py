import http.server
import json
import os
import sqlite3
import sys
import traceback
import urllib.parse

PORT = int(os.environ.get("PORT", sys.argv[1] if len(sys.argv) > 1 else 8080))
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "game.db")

def init_db():
    conn = sqlite3.connect(DB_FILE, timeout=10)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS game_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            student_name TEXT NOT NULL,
            total_score INTEGER DEFAULT 0,
            r1_score INTEGER DEFAULT 0,
            r2_score INTEGER DEFAULT 0,
            r3_score INTEGER DEFAULT 0,
            duration_seconds INTEGER DEFAULT 0,
            title TEXT DEFAULT '',
            status TEXT DEFAULT 'playing',
            created_at TEXT DEFAULT (datetime('now', 'localtime')),
            completed_at TEXT
        )
    """)
    conn.commit()
    conn.close()

def get_db():
    conn = sqlite3.connect(DB_FILE, timeout=10)
    conn.row_factory = sqlite3.Row
    return conn

class GameRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def log_message(self, format, *args):
        sys.stderr.write("%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))
        sys.stderr.flush()

    def send_json(self, data, status_code=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate')
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def read_json_body(self):
        content_length = int(self.headers.get('Content-Length', 0))
        if content_length > 0:
            raw = self.rfile.read(content_length).decode('utf-8')
            return json.loads(raw)
        return {}

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/leaderboard':
            try:
                params = urllib.parse.parse_qs(parsed.query)
                order = params.get('order', ['desc'])[0].lower()
                sort_dir = "ASC" if order == 'asc' else "DESC"
                status_filter = params.get('status', ['all'])[0].lower()

                conn = get_db()
                cursor = conn.cursor()

                where_clause = ""
                if status_filter == 'completed':
                    where_clause = "WHERE status = 'completed'"

                query = f"""
                    SELECT id, student_name, total_score, r1_score, r2_score, r3_score,
                           duration_seconds, title, status, created_at, completed_at
                    FROM game_sessions
                    {where_clause}
                    ORDER BY total_score {sort_dir}, duration_seconds ASC, id DESC
                """
                cursor.execute(query)
                rows = cursor.fetchall()

                players = []
                for rank, r in enumerate(rows, start=1):
                    players.append({
                        "rank": rank,
                        "id": r["id"],
                        "name": r["student_name"],
                        "total": r["total_score"],
                        "r1": r["r1_score"],
                        "r2": r["r2_score"],
                        "r3": r["r3_score"],
                        "duration": r["duration_seconds"],
                        "title": r["title"],
                        "status": r["status"],
                        "created_at": r["created_at"],
                        "completed_at": r["completed_at"]
                    })

                cursor.execute("""
                    SELECT 
                        COUNT(*) as total_played,
                        SUM(CASE WHEN status='completed' THEN 1 ELSE 0 END) as total_completed,
                        MAX(CASE WHEN status='completed' THEN total_score ELSE NULL END) as max_score,
                        MIN(CASE WHEN status='completed' THEN total_score ELSE NULL END) as min_score,
                        AVG(CASE WHEN status='completed' THEN total_score ELSE NULL END) as avg_score
                    FROM game_sessions
                """)
                stats_row = cursor.fetchone()

                cursor.execute("""
                    SELECT student_name, total_score FROM game_sessions
                    WHERE status='completed'
                    ORDER BY total_score DESC, duration_seconds ASC, id ASC LIMIT 1
                """)
                top_scorer = cursor.fetchone()

                cursor.execute("""
                    SELECT student_name, total_score FROM game_sessions
                    WHERE status='completed'
                    ORDER BY total_score ASC, duration_seconds DESC, id ASC LIMIT 1
                """)
                lowest_scorer = cursor.fetchone()

                stats = {
                    "total_players": (stats_row["total_played"] or 0) if stats_row else 0,
                    "total_completed": (stats_row["total_completed"] or 0) if stats_row else 0,
                    "highest_score": stats_row["max_score"] if (stats_row and stats_row["max_score"] is not None) else 0,
                    "highest_scorer_name": top_scorer["student_name"] if top_scorer else "-",
                    "lowest_score": stats_row["min_score"] if (stats_row and stats_row["min_score"] is not None) else 0,
                    "lowest_scorer_name": lowest_scorer["student_name"] if lowest_scorer else "-",
                    "average_score": round(stats_row["avg_score"], 1) if (stats_row and stats_row["avg_score"] is not None) else 0
                }

                conn.close()
                self.send_json({"players": players, "stats": stats})
                return
            except Exception as e:
                traceback.print_exc()
                self.send_json({"success": False, "error": str(e)}, status_code=500)
                return

        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/start':
            try:
                body = self.read_json_body()
                name = (body.get('name') or '').strip()
                if not name:
                    name = 'Anonim'
                name = name[:30]

                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO game_sessions (student_name, status, created_at)
                    VALUES (?, 'playing', datetime('now', 'localtime'))
                """, (name,))
                conn.commit()
                session_id = cursor.lastrowid
                conn.close()

                self.send_json({"success": True, "id": session_id, "name": name})
                return
            except Exception as e:
                traceback.print_exc()
                self.send_json({"success": False, "error": str(e)}, status_code=500)
                return

        elif parsed.path == '/api/finish':
            try:
                body = self.read_json_body()
                session_id = body.get('id')
                r1 = int(body.get('r1', 0))
                r2 = int(body.get('r2', 0))
                r3 = int(body.get('r3', 0))
                total = int(body.get('total', r1 + r2 + r3))
                title = str(body.get('title', ''))
                duration = int(body.get('duration', 0))

                conn = get_db()
                cursor = conn.cursor()

                if session_id:
                    cursor.execute("""
                        UPDATE game_sessions
                        SET total_score=?, r1_score=?, r2_score=?, r3_score=?,
                            title=?, duration_seconds=?, status='completed',
                            completed_at=datetime('now', 'localtime')
                        WHERE id=?
                    """, (total, r1, r2, r3, title, duration, session_id))
                else:
                    name = (body.get('name') or 'Anonim').strip()[:30]
                    cursor.execute("""
                        INSERT INTO game_sessions (
                            student_name, total_score, r1_score, r2_score, r3_score,
                            title, duration_seconds, status, created_at, completed_at
                        )
                        VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now', 'localtime'), datetime('now', 'localtime'))
                    """, (name, total, r1, r2, r3, title, duration))
                    session_id = cursor.lastrowid

                conn.commit()

                cursor.execute("""
                    SELECT COUNT(*) + 1 as rank
                    FROM game_sessions
                    WHERE status='completed' AND (total_score > ? OR (total_score = ? AND duration_seconds < ?))
                """, (total, total, duration))
                rank_row = cursor.fetchone()
                rank = rank_row["rank"] if rank_row else 1

                cursor.execute("SELECT COUNT(*) as total FROM game_sessions WHERE status='completed'")
                tot_row = cursor.fetchone()
                total_players = tot_row["total"] if tot_row else 1

                conn.close()

                self.send_json({"success": True, "id": session_id, "rank": rank, "total_players": total_players})
                return
            except Exception as e:
                traceback.print_exc()
                self.send_json({"success": False, "error": str(e)}, status_code=500)
                return

        elif parsed.path == '/api/reset':
            try:
                conn = get_db()
                cursor = conn.cursor()
                cursor.execute("DELETE FROM game_sessions")
                conn.commit()
                conn.close()
                self.send_json({"success": True, "message": "Database leaderboard berhasil di-reset"})
                return
            except Exception as e:
                traceback.print_exc()
                self.send_json({"success": False, "error": str(e)}, status_code=500)
                return

        self.send_response(404)
        self.end_headers()

def run(port=PORT):
    init_db()
    server_address = ('0.0.0.0', port)
    httpd = http.server.ThreadingHTTPServer(server_address, GameRequestHandler)
    print(f"Server game berjalan di http://localhost:{port}", flush=True)
    httpd.serve_forever()

if __name__ == '__main__':
    run()
