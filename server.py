import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
import urllib.parse
import urllib.request
from datetime import datetime, timedelta
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlparse

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.environ.get("DATA_DIR", BASE_DIR)
DB_PATH = os.path.join(DATA_DIR, "bizpilot.db")
SECRET_PATH = os.path.join(DATA_DIR, ".bizpilot_secret")

SAAS_PLANS = {
    "starter": {
        "id": "starter",
        "name": "Starter",
        "price": 0,
        "period": "бесплатно",
        "max_staff": 2,
        "max_bookings_month": 50,
        "sms_enabled": False,
        "features": ["До 2 сотрудников", "До 50 записей в месяц", "CRM и календарь", "Онлайн-запись /book/slug"],
    },
    "trial": {
        "id": "trial",
        "name": "Pro Trial (14 дней)",
        "price": 0,
        "period": "14 дней",
        "max_staff": 10,
        "max_bookings_month": 10000,
        "sms_enabled": True,
        "features": ["Все функции Pro на 14 дней", "До 10 сотрудников", "SMS-напоминания и ЮKassa", "Z-отчёты и аналитика"],
    },
    "pro": {
        "id": "pro",
        "name": "Pro",
        "price": 1490,
        "period": "мес",
        "max_staff": 10,
        "max_bookings_month": 10000,
        "sms_enabled": True,
        "features": ["До 10 сотрудников", "Безлимит записей", "SMS-напоминания (SMSC.ru)", "Приём оплат (ЮKassa)", "Z-отчёты и экспорт"],
    },
    "business": {
        "id": "business",
        "name": "Business",
        "price": 3490,
        "period": "мес",
        "max_staff": 999,
        "max_bookings_month": 100000,
        "sms_enabled": True,
        "features": ["Безлимит сотрудников и записей", "Все интеграции и вебхуки", "Приоритетная поддержка", "Персональная настройка"],
    },
}

_RATE_LOCK = threading.Lock()
_RATE_BUCKETS = {}


def check_rate_limit(ip: str, bucket: str, max_hits: int = 20, window_sec: int = 60) -> bool:
    now = time.time()
    key = f"{ip}:{bucket}"
    with _RATE_LOCK:
        hits = [t for t in _RATE_BUCKETS.get(key, []) if now - t < window_sec]
        if len(hits) >= max_hits:
            _RATE_BUCKETS[key] = hits
            return False
        hits.append(now)
        _RATE_BUCKETS[key] = hits
        return True


def get_secret():
    if os.path.exists(SECRET_PATH):
        with open(SECRET_PATH, "r", encoding="utf-8") as f:
            val = f.read().strip()
            if val:
                return val
    val = secrets.token_hex(32)
    with open(SECRET_PATH, "w", encoding="utf-8") as f:
        f.write(val)
    return val


APP_SECRET = get_secret()


def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def init_db():
    with get_db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT 'owner',
                created_at INTEGER NOT NULL
            );

            CREATE TABLE IF NOT EXISTS workspaces (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER UNIQUE NOT NULL,
                active_niche TEXT NOT NULL DEFAULT 'barbershop',
                currency TEXT NOT NULL DEFAULT '₽',
                theme TEXT NOT NULL DEFAULT 'light',
                demo_mode INTEGER NOT NULL DEFAULT 1,
                onboarding_done INTEGER NOT NULL DEFAULT 1,
                owner_name TEXT NOT NULL DEFAULT '',
                settings_json TEXT NOT NULL DEFAULT '{}',
                slug TEXT UNIQUE,
                updated_at INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS niche_profiles (
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                business_name TEXT NOT NULL DEFAULT '',
                address TEXT NOT NULL DEFAULT '',
                phone TEXT NOT NULL DEFAULT '',
                hours TEXT NOT NULL DEFAULT '09:00 — 21:00',
                PRIMARY KEY (workspace_id, niche_id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS clients (
                id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                name TEXT NOT NULL,
                phone TEXT NOT NULL DEFAULT '',
                segment TEXT NOT NULL DEFAULT 'Новый',
                visits INTEGER NOT NULL DEFAULT 0,
                ltv REAL NOT NULL DEFAULT 0,
                last_visit TEXT NOT NULL DEFAULT '',
                note TEXT NOT NULL DEFAULT '',
                tag TEXT NOT NULL DEFAULT '',
                PRIMARY KEY (workspace_id, niche_id, id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS services (
                id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                kind TEXT NOT NULL DEFAULT 'service',
                name TEXT NOT NULL,
                category TEXT NOT NULL DEFAULT 'Общее',
                price REAL NOT NULL DEFAULT 0,
                duration INTEGER NOT NULL DEFAULT 60,
                cost REAL NOT NULL DEFAULT 0,
                stock INTEGER,
                min_stock INTEGER,
                sku TEXT,
                active INTEGER NOT NULL DEFAULT 1,
                popular INTEGER NOT NULL DEFAULT 65,
                PRIMARY KEY (workspace_id, niche_id, id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS staff (
                id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                name TEXT NOT NULL,
                role TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'На смене',
                busy INTEGER NOT NULL DEFAULT 60,
                rating REAL NOT NULL DEFAULT 5.0,
                bookings_count INTEGER NOT NULL DEFAULT 0,
                revenue REAL NOT NULL DEFAULT 0,
                commission TEXT NOT NULL DEFAULT '40%',
                schedule TEXT NOT NULL DEFAULT '',
                tags_json TEXT NOT NULL DEFAULT '[]',
                PRIMARY KEY (workspace_id, niche_id, id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS bookings (
                id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                client_id TEXT NOT NULL,
                staff_id TEXT NOT NULL DEFAULT '',
                service_id TEXT NOT NULL DEFAULT '',
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                duration INTEGER NOT NULL DEFAULT 60,
                price REAL NOT NULL DEFAULT 0,
                status TEXT NOT NULL DEFAULT 'confirmed',
                extra TEXT NOT NULL DEFAULT '',
                channel TEXT NOT NULL DEFAULT '',
                PRIMARY KEY (workspace_id, niche_id, id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS notifications (
                id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                title TEXT NOT NULL,
                time_label TEXT NOT NULL DEFAULT '',
                unread INTEGER NOT NULL DEFAULT 1,
                PRIMARY KEY (workspace_id, id),
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS public_bookings (
                id TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                niche_id TEXT NOT NULL,
                service_id TEXT NOT NULL DEFAULT '',
                staff_id TEXT NOT NULL DEFAULT '',
                date TEXT NOT NULL,
                time TEXT NOT NULL,
                client_name TEXT NOT NULL DEFAULT '',
                client_phone TEXT NOT NULL DEFAULT '',
                client_email TEXT NOT NULL DEFAULT '',
                note TEXT NOT NULL DEFAULT '',
                status TEXT NOT NULL DEFAULT 'pending',
                created_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS payments (
                id TEXT PRIMARY KEY,
                workspace_id INTEGER NOT NULL,
                booking_id TEXT NOT NULL DEFAULT '',
                amount REAL NOT NULL DEFAULT 0,
                currency TEXT NOT NULL DEFAULT 'RUB',
                status TEXT NOT NULL DEFAULT 'pending',
                provider TEXT NOT NULL DEFAULT 'yookassa',
                created_at INTEGER NOT NULL,
                FOREIGN KEY (workspace_id) REFERENCES workspaces(id) ON DELETE CASCADE
            );

            CREATE TABLE IF NOT EXISTS password_resets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL,
                code TEXT NOT NULL,
                expires_at INTEGER NOT NULL,
                used INTEGER NOT NULL DEFAULT 0
            );

            CREATE TABLE IF NOT EXISTS sms_logs (
                booking_id TEXT NOT NULL,
                workspace_id INTEGER NOT NULL,
                kind TEXT NOT NULL,
                sent_at INTEGER NOT NULL,
                PRIMARY KEY (workspace_id, booking_id, kind)
            );

            CREATE TABLE IF NOT EXISTS plan_requests (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER,
                plan_id TEXT NOT NULL DEFAULT 'beta-pro',
                contact TEXT NOT NULL DEFAULT '',
                comment TEXT NOT NULL DEFAULT '',
                created_at INTEGER NOT NULL
            );
            """
        )
        # Migration: add slug, plan, plan_expires_at columns if not exist
        cols = [r["name"] for r in conn.execute("PRAGMA table_info(workspaces)").fetchall()]
        if "slug" not in cols:
            conn.execute("ALTER TABLE workspaces ADD COLUMN slug TEXT")
        if "plan" not in cols:
            conn.execute("ALTER TABLE workspaces ADD COLUMN plan TEXT NOT NULL DEFAULT 'trial'")
        if "plan_expires_at" not in cols:
            conn.execute("ALTER TABLE workspaces ADD COLUMN plan_expires_at INTEGER NOT NULL DEFAULT 0")
        conn.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_workspaces_slug ON workspaces(slug)")


def hash_password(password: str, salt: str | None = None):
    if salt is None:
        salt = secrets.token_hex(16)
    dk = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt.encode("utf-8"), 120_000)
    return dk.hex(), salt


def verify_password(password: str, expected_hash: str, salt: str) -> bool:
    actual_hash, _ = hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash)


def sign_token(user_id: int, email: str, role: str) -> str:
    payload = {
        "uid": user_id,
        "email": email,
        "role": role,
        "exp": int(time.time()) + 60 * 60 * 24 * 30,
    }
    b64 = base64.urlsafe_b64encode(json.dumps(payload).encode("utf-8")).decode("ascii").rstrip("=")
    sig = hmac.new(APP_SECRET.encode("utf-8"), b64.encode("utf-8"), hashlib.sha256).hexdigest()
    return f"{b64}.{sig}"


def verify_token(token: str):
    try:
        b64, sig = token.split(".", 1)
        expected = hmac.new(APP_SECRET.encode("utf-8"), b64.encode("utf-8"), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected):
            return None
        padded = b64 + "=" * (-len(b64) % 4)
        payload = json.loads(base64.urlsafe_b64decode(padded).decode("utf-8"))
        if payload.get("exp", 0) < int(time.time()):
            return None
        return payload
    except Exception:
        return None


def load_workspace_state(conn, user_id: int):
    ws = conn.execute("SELECT * FROM workspaces WHERE user_id = ?", (user_id,)).fetchone()
    if not ws:
        return None
    ws_id = ws["id"]

    profiles = conn.execute("SELECT * FROM niche_profiles WHERE workspace_id = ?", (ws_id,)).fetchall()
    if not profiles:
        return None

    niches_data = {}
    for p in profiles:
        nid = p["niche_id"]
        niches_data[nid] = {
            "businessName": p["business_name"],
            "address": p["address"],
            "phone": p["phone"],
            "hours": p["hours"],
            "staff": [],
            "services": [],
            "clients": [],
            "bookings": [],
        }

    for c in conn.execute("SELECT * FROM clients WHERE workspace_id = ?", (ws_id,)):
        if c["niche_id"] in niches_data:
            niches_data[c["niche_id"]]["clients"].append({
                "id": c["id"],
                "name": c["name"],
                "phone": c["phone"],
                "segment": c["segment"],
                "visits": c["visits"],
                "ltv": c["ltv"],
                "lastVisit": c["last_visit"],
                "note": c["note"],
                "tag": c["tag"],
            })

    for s in conn.execute("SELECT * FROM services WHERE workspace_id = ?", (ws_id,)):
        if s["niche_id"] in niches_data:
            item = {
                "id": s["id"],
                "kind": s["kind"],
                "name": s["name"],
                "category": s["category"],
                "price": s["price"],
                "duration": s["duration"],
                "cost": s["cost"],
                "sku": s["sku"],
                "active": bool(s["active"]),
                "popular": s["popular"],
            }
            if s["stock"] is not None:
                item["stock"] = s["stock"]
            if s["min_stock"] is not None:
                item["minStock"] = s["min_stock"]
            niches_data[s["niche_id"]]["services"].append(item)

    for st in conn.execute("SELECT * FROM staff WHERE workspace_id = ?", (ws_id,)):
        if st["niche_id"] in niches_data:
            niches_data[st["niche_id"]]["staff"].append({
                "id": st["id"],
                "name": st["name"],
                "role": st["role"],
                "status": st["status"],
                "busy": st["busy"],
                "rating": st["rating"],
                "bookingsCount": st["bookings_count"],
                "revenue": st["revenue"],
                "commission": st["commission"],
                "schedule": st["schedule"],
                "tags": json.loads(st["tags_json"] or "[]"),
            })

    for b in conn.execute("SELECT * FROM bookings WHERE workspace_id = ?", (ws_id,)):
        if b["niche_id"] in niches_data:
            niches_data[b["niche_id"]]["bookings"].append({
                "id": b["id"],
                "clientId": b["client_id"],
                "staffId": b["staff_id"],
                "serviceId": b["service_id"],
                "date": b["date"],
                "time": b["time"],
                "duration": b["duration"],
                "price": b["price"],
                "status": b["status"],
                "extra": b["extra"],
                "channel": b["channel"],
            })

    notifs = [
        {"id": n["id"], "title": n["title"], "time": n["time_label"], "unread": bool(n["unread"])}
        for n in conn.execute("SELECT * FROM notifications WHERE workspace_id = ?", (ws_id,))
    ]

    return {
        "activeNiche": ws["active_niche"],
        "currency": ws["currency"],
        "theme": ws["theme"],
        "demoMode": bool(ws["demo_mode"]),
        "onboardingDone": bool(ws["onboarding_done"]),
        "ownerName": ws["owner_name"],
        "settings": json.loads(ws["settings_json"] or "{}"),
        "notifications": notifs,
        "nichesData": niches_data,
    }


def save_workspace_state(conn, user_id: int, state: dict):
    now = int(time.time())
    ws = conn.execute("SELECT id FROM workspaces WHERE user_id = ?", (user_id,)).fetchone()
    if ws:
        ws_id = ws["id"]
        conn.execute(
            """
            UPDATE workspaces SET
                active_niche = ?, currency = ?, theme = ?, demo_mode = ?,
                onboarding_done = ?, owner_name = ?, settings_json = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                state.get("activeNiche", "barbershop"),
                state.get("currency", "₽"),
                state.get("theme", "light"),
                1 if state.get("demoMode", False) else 0,
                1 if state.get("onboardingDone", True) else 0,
                state.get("ownerName", ""),
                json.dumps(state.get("settings", {}), ensure_ascii=False),
                now,
                ws_id,
            ),
        )
    else:
        cur = conn.execute(
            """
            INSERT INTO workspaces (user_id, active_niche, currency, theme, demo_mode, onboarding_done, owner_name, settings_json, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                user_id,
                state.get("activeNiche", "barbershop"),
                state.get("currency", "₽"),
                state.get("theme", "light"),
                1 if state.get("demoMode", False) else 0,
                1 if state.get("onboardingDone", True) else 0,
                state.get("ownerName", ""),
                json.dumps(state.get("settings", {}), ensure_ascii=False),
                now,
            ),
        )
        ws_id = cur.lastrowid

    for table in ("niche_profiles", "clients", "services", "staff", "bookings", "notifications"):
        conn.execute(f"DELETE FROM {table} WHERE workspace_id = ?", (ws_id,))

    for n in state.get("notifications", []):
        conn.execute(
            "INSERT INTO notifications (id, workspace_id, title, time_label, unread) VALUES (?, ?, ?, ?, ?)",
            (n["id"], ws_id, n.get("title", ""), n.get("time", ""), 1 if n.get("unread") else 0),
        )

    for nid, ndata in state.get("nichesData", {}).items():
        conn.execute(
            "INSERT INTO niche_profiles (workspace_id, niche_id, business_name, address, phone, hours) VALUES (?, ?, ?, ?, ?, ?)",
            (ws_id, nid, ndata.get("businessName", ""), ndata.get("address", ""), ndata.get("phone", ""), ndata.get("hours", "")),
        )
        for c in ndata.get("clients", []):
            conn.execute(
                "INSERT INTO clients (id, workspace_id, niche_id, name, phone, segment, visits, ltv, last_visit, note, tag) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (c["id"], ws_id, nid, c.get("name", ""), c.get("phone", ""), c.get("segment", "Новый"), int(c.get("visits", 0)), float(c.get("ltv", 0)), c.get("lastVisit", ""), c.get("note", ""), c.get("tag", "")),
            )
        for s in ndata.get("services", []):
            conn.execute(
                "INSERT INTO services (id, workspace_id, niche_id, kind, name, category, price, duration, cost, stock, min_stock, sku, active, popular) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (s["id"], ws_id, nid, s.get("kind", "service"), s.get("name", ""), s.get("category", "Общее"), float(s.get("price", 0)), int(s.get("duration", 60)), float(s.get("cost", 0)), s.get("stock"), s.get("minStock"), s.get("sku"), 1 if s.get("active", True) else 0, int(s.get("popular", 65))),
            )
        for st in ndata.get("staff", []):
            conn.execute(
                "INSERT INTO staff (id, workspace_id, niche_id, name, role, status, busy, rating, bookings_count, revenue, commission, schedule, tags_json) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (st["id"], ws_id, nid, st.get("name", ""), st.get("role", ""), st.get("status", "На смене"), int(st.get("busy", 60)), float(st.get("rating", 5.0)), int(st.get("bookingsCount", 0)), float(st.get("revenue", 0)), st.get("commission", "40%"), st.get("schedule", ""), json.dumps(st.get("tags", []), ensure_ascii=False)),
            )
        for b in ndata.get("bookings", []):
            conn.execute(
                "INSERT INTO bookings (id, workspace_id, niche_id, client_id, staff_id, service_id, date, time, duration, price, status, extra, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (b["id"], ws_id, nid, b.get("clientId", ""), b.get("staffId", ""), b.get("serviceId", ""), b.get("date", ""), b.get("time", ""), int(b.get("duration", 60)), float(b.get("price", 0)), b.get("status", "confirmed"), b.get("extra", ""), b.get("channel", "")),
            )


class BizPilotHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("X-Frame-Options", "SAMEORIGIN")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        super().end_headers()

    def client_ip(self):
        fwd = self.headers.get("X-Forwarded-For", "")
        if fwd:
            return fwd.split(",")[0].strip()
        return self.client_address[0] if self.client_address else "unknown"

    def send_json(self, status: int, payload: dict):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def read_json_body(self):
        length = int(self.headers.get("Content-Length", "0") or 0)
        if length <= 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def get_auth_user(self):
        auth = self.headers.get("Authorization", "")
        if not auth.startswith("Bearer "):
            return None
        token = auth[7:].strip()
        return verify_token(token)

    def do_GET(self):
        path = urlparse(self.path).path
        if path == "/api/health":
            return self.send_json(200, {"ok": True, "db": "sqlite3"})

        if path == "/api/auth/me":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            with get_db() as conn:
                user = conn.execute("SELECT id, email, name, role FROM users WHERE id = ?", (claims["uid"],)).fetchone()
                if not user:
                    return self.send_json(401, {"error": "Пользователь не найден"})
                return self.send_json(200, {"user": dict(user)})

        if path == "/api/workspace":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            with get_db() as conn:
                state = load_workspace_state(conn, claims["uid"])
                return self.send_json(200, {"state": state})

        # Public booking API: GET /api/book/<slug>
        if path.startswith("/api/book/"):
            slug = path[len("/api/book/"):].strip("/")
            if not slug:
                return self.send_json(400, {"error": "Slug не указан"})
            with get_db() as conn:
                ws = conn.execute("SELECT * FROM workspaces WHERE slug = ?", (slug,)).fetchone()
                if not ws:
                    return self.send_json(404, {"error": "Бизнес не найден"})
                ws_id = ws["id"]
                niche_id = ws["active_niche"]
                profile = conn.execute(
                    "SELECT * FROM niche_profiles WHERE workspace_id = ? AND niche_id = ?",
                    (ws_id, niche_id)
                ).fetchone()
                services = [
                    {"id": s["id"], "name": s["name"], "price": s["price"], "duration": s["duration"]}
                    for s in conn.execute(
                        "SELECT id, name, price, duration FROM services WHERE workspace_id = ? AND niche_id = ? AND active = 1",
                        (ws_id, niche_id)
                    )
                ]
                staff_rows = [
                    {"id": st["id"], "name": st["name"], "role": st["role"]}
                    for st in conn.execute(
                        "SELECT id, name, role FROM staff WHERE workspace_id = ? AND niche_id = ?",
                        (ws_id, niche_id)
                    )
                ]
                # Collect booked date+time slots for next 30 days
                booked = {}
                for b in conn.execute(
                    "SELECT date, time FROM bookings WHERE workspace_id = ? AND niche_id = ? AND status != 'cancelled'",
                    (ws_id, niche_id)
                ):
                    booked.setdefault(b["date"], []).append(b["time"])
                # Also from public bookings (pending/confirmed)
                for b in conn.execute(
                    "SELECT date, time FROM public_bookings WHERE workspace_id = ? AND niche_id = ? AND status != 'cancelled'",
                    (ws_id, niche_id)
                ):
                    booked.setdefault(b["date"], []).append(b["time"])
                settings = json.loads(ws["settings_json"] or "{}")
                return self.send_json(200, {
                    "slug": slug,
                    "name": profile["business_name"] if profile else "",
                    "niche_label": niche_id,
                    "address": profile["address"] if profile else "",
                    "phone": profile["phone"] if profile else "",
                    "hours": profile["hours"] if profile else "09:00 — 21:00",
                    "accent": settings.get("accentColor", "#6366f1"),
                    "services": services,
                    "staff": staff_rows,
                    "booked_slots": booked,
                })

        # Serve /book/<slug> → booking.html SPA
        if path.startswith("/book/"):
            booking_path = os.path.join(BASE_DIR, "booking.html")
            if os.path.exists(booking_path):
                with open(booking_path, "rb") as f:
                    content = f.read()
                self.send_response(200)
                self.send_header("Content-Type", "text/html; charset=utf-8")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            else:
                self.send_json(404, {"error": "booking.html not found"})
            return

        if path == "/api/billing/plans":
            claims = self.get_auth_user()
            current_plan = "trial"
            expires_at = 0
            usage = {"staff": 0, "bookings": 0}
            if claims:
                with get_db() as conn:
                    ws = conn.execute("SELECT id, plan, plan_expires_at, active_niche FROM workspaces WHERE user_id = ?", (claims["uid"],)).fetchone()
                    if ws:
                        current_plan = ws["plan"] or "trial"
                        expires_at = ws["plan_expires_at"] or 0
                        if current_plan in ("trial", "pro", "business") and expires_at and expires_at < int(time.time()):
                            current_plan = "starter"
                        usage["staff"] = conn.execute("SELECT COUNT(*) FROM staff WHERE workspace_id=? AND niche_id=?", (ws["id"], ws["active_niche"])).fetchone()[0]
                        usage["bookings"] = conn.execute("SELECT COUNT(*) FROM bookings WHERE workspace_id=? AND niche_id=?", (ws["id"], ws["active_niche"])).fetchone()[0]
            return self.send_json(200, {
                "plans": list(SAAS_PLANS.values()),
                "current_plan": current_plan,
                "expires_at": expires_at,
                "usage": usage,
            })

        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        ip = self.client_ip()
        if path.startswith("/api/auth/") and not check_rate_limit(ip, "auth", max_hits=25, window_sec=60):
            return self.send_json(429, {"error": "Слишком много попыток. Подождите минуту."})
        if path == "/api/book" and not check_rate_limit(ip, "book", max_hits=15, window_sec=60):
            return self.send_json(429, {"error": "Слишком много запросов. Повторите позже."})
        try:
            body = self.read_json_body()
        except Exception:
            return self.send_json(400, {"error": "Некорректный JSON"})

        if path == "/api/auth/register":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            name = (body.get("name") or "").strip() or "Владелец"
            if not email or "@" not in email:
                return self.send_json(400, {"error": "Укажите корректный email"})
            if len(password) < 6:
                return self.send_json(400, {"error": "Пароль должен быть не короче 6 символов"})

            pw_hash, salt = hash_password(password)
            with get_db() as conn:
                existing = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
                if existing:
                    return self.send_json(409, {"error": "Пользователь с таким email уже существует"})
                cur = conn.execute(
                    "INSERT INTO users (email, password_hash, salt, name, role, created_at) VALUES (?, ?, ?, ?, 'owner', ?)",
                    (email, pw_hash, salt, name, int(time.time())),
                )
                uid = cur.lastrowid
                if body.get("initialState"):
                    save_workspace_state(conn, uid, body["initialState"])
                token = sign_token(uid, email, "owner")
                return self.send_json(201, {
                    "token": token,
                    "user": {"id": uid, "email": email, "name": name, "role": "owner"},
                })

        if path == "/api/auth/login":
            email = (body.get("email") or "").strip().lower()
            password = body.get("password") or ""
            with get_db() as conn:
                user = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
                if not user or not verify_password(password, user["password_hash"], user["salt"]):
                    return self.send_json(401, {"error": "Неверный email или пароль"})
                token = sign_token(user["id"], user["email"], user["role"])
                state = load_workspace_state(conn, user["id"])
                return self.send_json(200, {
                    "token": token,
                    "user": {"id": user["id"], "email": user["email"], "name": user["name"], "role": user["role"]},
                    "state": state,
                })

        # Public online booking submission: POST /api/book
        if path == "/api/book":
            slug = (body.get("slug") or "").strip()
            if not slug:
                return self.send_json(400, {"error": "Slug не указан"})
            with get_db() as conn:
                ws = conn.execute("SELECT * FROM workspaces WHERE slug = ?", (slug,)).fetchone()
                if not ws:
                    return self.send_json(404, {"error": "Бизнес не найден"})
                ws_id = ws["id"]
                niche_id = ws["active_niche"]
                client = body.get("client") or {}
                date = body.get("date", "")
                time_slot = body.get("time", "")
                service_id = str(body.get("service_id") or "")
                staff_id = str(body.get("staff_id") or "")
                if not client.get("name") or not client.get("phone"):
                    return self.send_json(400, {"error": "Имя и телефон обязательны"})
                if not date or not time_slot:
                    return self.send_json(400, {"error": "Дата и время обязательны"})
                # Check if slot is taken
                taken = conn.execute(
                    "SELECT id FROM bookings WHERE workspace_id=? AND niche_id=? AND date=? AND time=? AND status!='cancelled'",
                    (ws_id, niche_id, date, time_slot)
                ).fetchone()
                if taken:
                    return self.send_json(409, {"error": "Это время уже занято, выберите другое"})
                taken2 = conn.execute(
                    "SELECT id FROM public_bookings WHERE workspace_id=? AND niche_id=? AND date=? AND time=? AND status!='cancelled'",
                    (ws_id, niche_id, date, time_slot)
                ).fetchone()
                if taken2:
                    return self.send_json(409, {"error": "Это время уже занято, выберите другое"})

                booking_id = "bk-" + secrets.token_hex(4)
                conn.execute(
                    """INSERT INTO public_bookings
                       (id, workspace_id, niche_id, service_id, staff_id, date, time,
                        client_name, client_phone, client_email, note, status, created_at)
                       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?)""",
                    (booking_id, ws_id, niche_id, service_id, staff_id, date, time_slot,
                     client.get("name", ""), client.get("phone", ""),
                     client.get("email", ""), client.get("note", ""), int(time.time()))
                )

                # Ensure client exists in CRM and add booking to workspace bookings
                c_phone = (client.get("phone") or "").strip()
                c_name = (client.get("name") or "").strip()
                existing_client = conn.execute(
                    "SELECT id FROM clients WHERE workspace_id=? AND niche_id=? AND phone=?",
                    (ws_id, niche_id, c_phone)
                ).fetchone()
                if existing_client:
                    client_id = existing_client["id"]
                else:
                    client_id = "cl-" + secrets.token_hex(4)
                    conn.execute(
                        "INSERT INTO clients (id, workspace_id, niche_id, name, phone, segment, visits, ltv, last_visit, note, tag) VALUES (?, ?, ?, ?, ?, 'Новый', 0, 0, ?, ?, 'Онлайн')",
                        (client_id, ws_id, niche_id, c_name, c_phone, date, client.get("note", ""))
                    )

                svc_row = conn.execute(
                    "SELECT price, duration FROM services WHERE workspace_id=? AND niche_id=? AND id=?",
                    (ws_id, niche_id, service_id)
                ).fetchone()
                svc_price = float(svc_row["price"]) if svc_row else 0.0
                svc_dur = int(svc_row["duration"]) if svc_row else 60

                conn.execute(
                    "INSERT INTO bookings (id, workspace_id, niche_id, client_id, staff_id, service_id, date, time, duration, price, status, extra, channel) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, 'Онлайн-виджет')",
                    (booking_id, ws_id, niche_id, client_id, staff_id, service_id, date, time_slot, svc_dur, svc_price, client.get("note", ""))
                )

                # Also create a notification for the business owner
                notif_id = secrets.token_hex(6)
                from datetime import datetime
                date_fmt = datetime.strptime(date, "%Y-%m-%d").strftime("%d.%m") if date else date
                conn.execute(
                    "INSERT INTO notifications (id, workspace_id, title, time_label, unread) VALUES (?, ?, ?, ?, 1)",
                    (notif_id, ws_id,
                     f"Новая онлайн-запись: {client.get('name','')} на {date_fmt} в {time_slot}",
                     "только что")
                )
                return self.send_json(201, {"ok": True, "booking_id": booking_id})

        # SMS notification via SMSC.ru API
        if path == "/api/notify/sms":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            phone = (body.get("phone") or "").strip()
            message = (body.get("message") or "").strip()
            if not phone or not message:
                return self.send_json(400, {"error": "Укажите телефон и текст сообщения"})

            with get_db() as conn:
                ws = conn.execute("SELECT settings_json FROM workspaces WHERE user_id = ?", (claims["uid"],)).fetchone()
                settings = json.loads(ws["settings_json"] or "{}") if ws else {}
            login = (body.get("login") or settings.get("smscLogin") or "").strip()
            psw = (body.get("password") or settings.get("smscPassword") or "").strip()

            if body.get("dryRun") or not (login and psw):
                if not (login and psw) and not body.get("dryRun"):
                    return self.send_json(400, {"error": "Укажите логин и пароль/API-ключ SMSC.ru в Настройках"})
                return self.send_json(200, {"ok": True, "dryRun": True, "phone": phone, "message": message})

            import urllib.request
            import urllib.parse
            params = urllib.parse.urlencode({
                "login": login,
                "psw": psw,
                "phones": phone,
                "mes": message,
                "fmt": 3,
                "charset": "utf-8",
            })
            try:
                with urllib.request.urlopen(f"https://smsc.ru/sys/send.php?{params}", timeout=10) as resp:
                    res = json.loads(resp.read().decode("utf-8"))
                if res.get("error"):
                    return self.send_json(502, {"error": f"SMSC.ru: {res.get('error')}"})
                return self.send_json(200, {"ok": True, "result": res})
            except Exception as exc:
                return self.send_json(502, {"error": f"Ошибка отправки SMS: {exc}"})

        # YooKassa payment creation
        if path == "/api/payments/create":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            amount = body.get("amount")
            description = (body.get("description") or "Оплата услуги BizPilot").strip()
            booking_id = str(body.get("booking_id") or "")
            return_url = (body.get("return_url") or "http://localhost:8123").strip()
            if not amount or float(amount) <= 0:
                return self.send_json(400, {"error": "Укажите корректную сумму"})

            with get_db() as conn:
                ws = conn.execute("SELECT id, settings_json FROM workspaces WHERE user_id = ?", (claims["uid"],)).fetchone()
                if not ws:
                    return self.send_json(404, {"error": "Workspace не найден"})
                settings = json.loads(ws["settings_json"] or "{}")
                shop_id = (body.get("shop_id") or settings.get("yookassaShopId") or "").strip()
                secret_key = (body.get("secret_key") or settings.get("yookassaSecretKey") or "").strip()

                if body.get("dryRun") or not (shop_id and secret_key):
                    if not (shop_id and secret_key) and not body.get("dryRun"):
                        return self.send_json(400, {"error": "Укажите Shop ID и Секретный ключ ЮKassa в Настройках"})
                    pay_id = "pay-dry-" + secrets.token_hex(4)
                    conn.execute(
                        "INSERT INTO payments (id, workspace_id, booking_id, amount, currency, status, provider, created_at) VALUES (?, ?, ?, ?, 'RUB', 'pending', 'yookassa', ?)",
                        (pay_id, ws["id"], booking_id, float(amount), int(time.time()))
                    )
                    return self.send_json(200, {
                        "ok": True,
                        "dryRun": True,
                        "payment_id": pay_id,
                        "confirmation_url": return_url,
                    })

            import urllib.request
            auth_b64 = base64.b64encode(f"{shop_id}:{secret_key}".encode("utf-8")).decode("ascii")
            idem_key = secrets.token_hex(16)
            payload = json.dumps({
                "amount": {"value": f"{float(amount):.2f}", "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "capture": True,
                "description": description,
                "metadata": {"booking_id": booking_id, "workspace_id": ws["id"]},
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.yookassa.ru/v3/payments",
                data=payload,
                headers={
                    "Authorization": f"Basic {auth_b64}",
                    "Idempotence-Key": idem_key,
                    "Content-Type": "application/json",
                },
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res = json.loads(resp.read().decode("utf-8"))
                pay_id = res.get("id", "pay-" + secrets.token_hex(4))
                with get_db() as conn:
                    conn.execute(
                        "INSERT INTO payments (id, workspace_id, booking_id, amount, currency, status, provider, created_at) VALUES (?, ?, ?, ?, 'RUB', ?, 'yookassa', ?)",
                        (pay_id, ws["id"], booking_id, float(amount), res.get("status", "pending"), int(time.time()))
                    )
                conf_url = (res.get("confirmation") or {}).get("confirmation_url", "")
                return self.send_json(200, {"ok": True, "payment_id": pay_id, "confirmation_url": conf_url, "status": res.get("status")})
            except Exception as exc:
                return self.send_json(502, {"error": f"Ошибка ЮKassa: {exc}"})

        # YooKassa webhook
        if path == "/api/payments/webhook":
            obj = body.get("object") or {}
            pay_id = obj.get("id")
            status = obj.get("status")
            if pay_id and status:
                with get_db() as conn:
                    conn.execute("UPDATE payments SET status = ? WHERE id = ?", (status, pay_id))
                    # If subscription payment succeeded, activate plan
                    meta = obj.get("metadata") or {}
                    if status == "succeeded" and meta.get("type") == "saas_subscription":
                        ws_id = meta.get("workspace_id")
                        plan_id = meta.get("plan_id")
                        if ws_id and plan_id in SAAS_PLANS:
                            conn.execute(
                                "UPDATE workspaces SET plan = ?, plan_expires_at = ? WHERE id = ?",
                                (plan_id, int(time.time()) + 30 * 86400, ws_id)
                            )
            return self.send_json(200, {"ok": True})

        # Password reset request: POST /api/auth/forgot
        if path == "/api/auth/forgot":
            email = (body.get("email") or "").strip().lower()
            if not email or "@" not in email:
                return self.send_json(400, {"error": "Укажите корректный email"})
            with get_db() as conn:
                user = conn.execute("SELECT id FROM users WHERE email = ?", (email,)).fetchone()
                if not user:
                    return self.send_json(200, {"ok": True, "message": "Если аккаунт существует, код отправлен"})
                code = f"{secrets.randbelow(900000) + 100000}"
                conn.execute(
                    "INSERT INTO password_resets (email, code, expires_at, used) VALUES (?, ?, ?, 0)",
                    (email, code, int(time.time()) + 900)
                )
            # Optional SMTP send if configured via env
            smtp_host = os.environ.get("SMTP_HOST", "")
            sent_email = False
            if smtp_host:
                try:
                    import smtplib
                    from email.message import EmailMessage
                    msg = EmailMessage()
                    msg["Subject"] = "BizPilot: код восстановления пароля"
                    msg["From"] = os.environ.get("SMTP_FROM", "noreply@bizpilot.ru")
                    msg["To"] = email
                    msg.set_content(f"Ваш код восстановления пароля: {code}\nДействует 15 минут.")
                    with smtplib.SMTP(smtp_host, int(os.environ.get("SMTP_PORT", "587")), timeout=10) as s:
                        s.starttls()
                        if os.environ.get("SMTP_USER"):
                            s.login(os.environ["SMTP_USER"], os.environ.get("SMTP_PASS", ""))
                        s.send_message(msg)
                    sent_email = True
                except Exception as exc:
                    print(f"[SMTP] Failed to send reset email: {exc}")
            print(f"[Auth] Password reset code for {email}: {code}")
            resp = {"ok": True, "message": "Код восстановления отправлен на email"}
            if not sent_email and os.environ.get("BIZPILOT_ENV", "dev") != "production":
                resp["dev_code"] = code
            return self.send_json(200, resp)

        # Password reset confirm: POST /api/auth/reset
        if path == "/api/auth/reset":
            email = (body.get("email") or "").strip().lower()
            code = (body.get("code") or "").strip()
            new_password = body.get("new_password") or ""
            if len(new_password) < 6:
                return self.send_json(400, {"error": "Новый пароль должен быть не короче 6 символов"})
            with get_db() as conn:
                row = conn.execute(
                    "SELECT * FROM password_resets WHERE email=? AND code=? AND used=0 ORDER BY id DESC LIMIT 1",
                    (email, code)
                ).fetchone()
                if not row or row["expires_at"] < int(time.time()):
                    return self.send_json(400, {"error": "Неверный или просроченный код"})
                pw_hash, salt = hash_password(new_password)
                conn.execute("UPDATE users SET password_hash=?, salt=? WHERE email=?", (pw_hash, salt, email))
                conn.execute("UPDATE password_resets SET used=1 WHERE id=?", (row["id"],))
            return self.send_json(200, {"ok": True, "message": "Пароль успешно изменён"})

        # Beta plan / support request: POST /api/billing/request
        if path == "/api/billing/request":
            claims = self.get_auth_user()
            contact = (body.get("contact") or "").strip()
            if not contact:
                return self.send_json(400, {"error": "Укажите контакт для связи"})
            with get_db() as conn:
                conn.execute(
                    "INSERT INTO plan_requests (user_id, plan_id, contact, comment, created_at) VALUES (?, ?, ?, ?, ?)",
                    (claims["uid"] if claims else None, (body.get("plan_id") or "beta-pro")[:40], contact[:120], (body.get("comment") or "")[:300], int(time.time()))
                )
            return self.send_json(201, {"ok": True})

        # SaaS subscription checkout: POST /api/billing/subscribe
        if path == "/api/billing/subscribe":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            plan_id = (body.get("plan_id") or "").strip()
            if plan_id not in SAAS_PLANS or plan_id == "trial":
                return self.send_json(400, {"error": "Некорректный тариф"})
            plan = SAAS_PLANS[plan_id]
            with get_db() as conn:
                ws = conn.execute("SELECT id FROM workspaces WHERE user_id = ?", (claims["uid"],)).fetchone()
                if not ws:
                    return self.send_json(404, {"error": "Workspace не найден"})
                if plan["price"] == 0:
                    conn.execute("UPDATE workspaces SET plan='starter', plan_expires_at=0 WHERE id=?", (ws["id"],))
                    return self.send_json(200, {"ok": True, "plan": "starter", "activated": True})

                shop_id = os.environ.get("YOOKASSA_PLATFORM_SHOP_ID", "").strip()
                secret_key = os.environ.get("YOOKASSA_PLATFORM_SECRET", "").strip()
                return_url = (body.get("return_url") or "http://localhost:8123/?billing=ok").strip()

                if not (shop_id and secret_key) or body.get("dryRun"):
                    expires = int(time.time()) + 30 * 86400
                    conn.execute("UPDATE workspaces SET plan=?, plan_expires_at=? WHERE id=?", (plan_id, expires, ws["id"]))
                    return self.send_json(200, {"ok": True, "dryRun": True, "plan": plan_id, "expires_at": expires, "activated": True})

            auth_b64 = base64.b64encode(f"{shop_id}:{secret_key}".encode("utf-8")).decode("ascii")
            payload = json.dumps({
                "amount": {"value": f"{plan['price']:.2f}", "currency": "RUB"},
                "confirmation": {"type": "redirect", "return_url": return_url},
                "capture": True,
                "description": f"Подписка BizPilot {plan['name']} (30 дней)",
                "metadata": {"type": "saas_subscription", "workspace_id": ws["id"], "plan_id": plan_id},
            }).encode("utf-8")
            req = urllib.request.Request(
                "https://api.yookassa.ru/v3/payments",
                data=payload,
                headers={"Authorization": f"Basic {auth_b64}", "Idempotence-Key": secrets.token_hex(16), "Content-Type": "application/json"},
                method="POST",
            )
            try:
                with urllib.request.urlopen(req, timeout=10) as resp:
                    res = json.loads(resp.read().decode("utf-8"))
                return self.send_json(200, {"ok": True, "confirmation_url": (res.get("confirmation") or {}).get("confirmation_url", "")})
            except Exception as exc:
                return self.send_json(502, {"error": f"Ошибка ЮKassa: {exc}"})

        return self.send_json(404, {"error": "Маршрут не найден"})

    def do_PUT(self):
        path = urlparse(self.path).path
        if path == "/api/workspace":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            try:
                body = self.read_json_body()
            except Exception:
                return self.send_json(400, {"error": "Некорректный JSON"})
            state = body.get("state")
            if not isinstance(state, dict):
                return self.send_json(400, {"error": "Поле state обязательно"})
            with get_db() as conn:
                save_workspace_state(conn, claims["uid"], state)
            return self.send_json(200, {"ok": True})

        if path == "/api/workspace/slug":
            claims = self.get_auth_user()
            if not claims:
                return self.send_json(401, {"error": "Не авторизован"})
            try:
                body = self.read_json_body()
            except Exception:
                return self.send_json(400, {"error": "Некорректный JSON"})
            slug = (body.get("slug") or "").strip().lower()
            import re
            if not slug or not re.match(r'^[a-z0-9\-]{3,40}$', slug):
                return self.send_json(400, {"error": "Slug: 3-40 символов, только латиница, цифры и дефис"})
            with get_db() as conn:
                # Check uniqueness
                existing = conn.execute(
                    "SELECT user_id FROM workspaces WHERE slug = ? AND user_id != ?",
                    (slug, claims["uid"])
                ).fetchone()
                if existing:
                    return self.send_json(409, {"error": "Этот slug уже занят, выберите другой"})
                conn.execute(
                    "UPDATE workspaces SET slug = ? WHERE user_id = ?",
                    (slug, claims["uid"])
                )
            return self.send_json(200, {"ok": True, "slug": slug, "url": f"/book/{slug}"})

        return self.send_json(404, {"error": "Маршрут не найден"})


def sms_reminder_worker():
    """Background worker: checks upcoming bookings and sends SMS reminders via SMSC.ru."""
    while True:
        time.sleep(300)
        try:
            now_dt = datetime.now()
            today_str = now_dt.strftime("%Y-%m-%d")
            tomorrow_str = (now_dt + timedelta(days=1)).strftime("%Y-%m-%d")
            with get_db() as conn:
                workspaces = conn.execute("SELECT id, active_niche, settings_json, plan FROM workspaces").fetchall()
                for ws in workspaces:
                    settings = json.loads(ws["settings_json"] or "{}")
                    if not settings.get("smsReminders"):
                        continue
                    login = (settings.get("smscLogin") or "").strip()
                    psw = (settings.get("smscPassword") or "").strip()
                    if not (login and psw):
                        continue
                    timing = settings.get("smsTiming", "2h")
                    rows = conn.execute(
                        """SELECT b.id, b.date, b.time, c.phone, c.name
                           FROM bookings b
                           JOIN clients c ON c.id = b.client_id AND c.workspace_id = b.workspace_id AND c.niche_id = b.niche_id
                           WHERE b.workspace_id=? AND b.niche_id=? AND b.status IN ('confirmed', 'pending')
                             AND b.date IN (?, ?)""",
                        (ws["id"], ws["active_niche"], today_str, tomorrow_str),
                    ).fetchall()
                    for r in rows:
                        if not r["phone"]:
                            continue
                        try:
                            bk_dt = datetime.strptime(f"{r['date']} {r['time']}", "%Y-%m-%d %H:%M")
                        except ValueError:
                            continue
                        diff_min = (bk_dt - now_dt).total_seconds() / 60.0
                        kind = None
                        if timing in ("2h", "both") and 90 <= diff_min <= 135:
                            kind = "2h"
                        elif timing in ("24h", "both") and 1400 <= diff_min <= 1460:
                            kind = "24h"
                        if not kind:
                            continue
                        already = conn.execute(
                            "SELECT 1 FROM sms_logs WHERE workspace_id=? AND booking_id=? AND kind=?",
                            (ws["id"], r["id"], kind),
                        ).fetchone()
                        if already:
                            continue
                        msg = f"Напоминаем о записи {r['date']} в {r['time']}. Ждём вас!"
                        params = urllib.parse.urlencode({"login": login, "psw": psw, "phones": r["phone"], "mes": msg, "fmt": 3, "charset": "utf-8"})
                        try:
                            urllib.request.urlopen(f"https://smsc.ru/sys/send.php?{params}", timeout=8).read()
                            conn.execute(
                                "INSERT INTO sms_logs (booking_id, workspace_id, kind, sent_at) VALUES (?, ?, ?, ?)",
                                (r["id"], ws["id"], kind, int(time.time())),
                            )
                        except Exception as exc:
                            print(f"[SMS Worker] Error: {exc}")
        except Exception as exc:
            print(f"[SMS Worker] Loop error: {exc}")


if __name__ == "__main__":
    init_db()
    threading.Thread(target=sms_reminder_worker, daemon=True).start()
    port = int(os.environ.get("PORT", "8123"))
    server = ThreadingHTTPServer(("0.0.0.0", port), BizPilotHandler)
    print(f"BizPilot API & App running on http://localhost:{port}")
    server.serve_forever()
