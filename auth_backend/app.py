from flask import Flask, request, jsonify, make_response, send_file
from flask_cors import CORS
from flask_login import LoginManager, login_user, login_required, logout_user, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from database import db, User, ChatSession, ChatMessage, Document, AdminCredentials
from email_validator import validate_email, EmailNotValidError
import io

app = Flask(__name__)

import os as _os
# In production allow all origins — lock down later with specific URLs
CORS(app, resources={
    r"/*": {
        "origins": "*",
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization", "X-User-Email"],
    }
})

import os
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'sqlite:///users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)

login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

ADMIN_TOKEN = 'admin-token-here'


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))


def check_admin_token():
    """Return True if the request carries a valid admin Bearer token."""
    auth_header = request.headers.get('Authorization', '')
    if auth_header.startswith('Bearer '):
        token = auth_header[len('Bearer '):]
        return token == ADMIN_TOKEN
    return False


def get_user_from_request():
    """Extract user from email header or query param sent by frontend."""
    email = (
        request.headers.get('X-User-Email') or
        request.args.get('email') or
        (request.get_json(silent=True) or {}).get('user_email')
    )
    if email:
        return User.query.filter_by(email=email).first()
    return None


def require_not_blocked():
    """Return a 403 JSON response if the requesting user is blocked, else None."""
    user = get_user_from_request()
    if user and user.is_blocked:
        return jsonify({
            "status": "error",
            "message": "Your account has been blocked. Please contact the admin.",
            "blocked": True
        }), 403
    return None


with app.app_context():
    db.create_all()
    # Seed default admin if none exists
    if not AdminCredentials.query.first():
        default_admin = AdminCredentials(username='admin')
        default_admin.set_password('admin123')
        db.session.add(default_admin)
        db.session.commit()


# ---------------------------------------------------------------------------
# Public routes
# ---------------------------------------------------------------------------

@app.route('/')
def home():
    return jsonify({"status": "ok", "message": "Auth API is running"})


@app.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400
    user = User.query.filter_by(email=email).first()
    if user and user.check_password(password):
        if user.is_blocked:
            return jsonify({"status": "error", "message": "Your account has been blocked."}), 403
        login_user(user)
        return jsonify({
            "status": "success",
            "message": "Logged in successfully",
            "token": "your-jwt-token-here",
            "user": {"id": user.id, "email": user.email}
        })
    return jsonify({"status": "error", "message": "Invalid email or password"}), 401


@app.route('/signup', methods=['POST'])
def signup():
    data = request.get_json()
    email = data.get('email')
    password = data.get('password')
    if not email or not password:
        return jsonify({"status": "error", "message": "Email and password are required"}), 400
    try:
        valid = validate_email(email)
        email = valid.email
        if User.query.filter_by(email=email).first():
            return jsonify({"status": "error", "message": "Email already registered"}), 400
        user = User(email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        return jsonify({
            "status": "success",
            "message": "Registration successful! Please log in.",
            "user": {"email": user.email}
        })
    except EmailNotValidError:
        return jsonify({"status": "error", "message": "Invalid email address"}), 400
    except Exception:
        db.session.rollback()
        return jsonify({"status": "error", "message": "An error occurred. Please try again."}), 500


@app.route('/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({"status": "success", "message": "Logged out successfully"})


# ---------------------------------------------------------------------------
# Admin routes
# ---------------------------------------------------------------------------

@app.route('/admin/login', methods=['POST'])
def admin_login():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    if not username or not password:
        return jsonify({"status": "error", "message": "Username and password are required"}), 400
    admin = AdminCredentials.query.filter_by(username=username).first()
    if admin and admin.check_password(password):
        return jsonify({
            "status": "success",
            "token": ADMIN_TOKEN,
            "admin": {"username": admin.username}
        })
    return jsonify({"status": "error", "message": "Invalid admin credentials"}), 401


@app.route('/admin/users', methods=['GET'])
def admin_get_users():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    users = User.query.all()
    result = []
    for u in users:
        result.append({
            "id": u.id,
            "email": u.email,
            "is_blocked": u.is_blocked,
            "created_at": u.created_at.isoformat() if u.created_at else None,
            "ai_usage_count": u.ai_usage_count,
            "ai_tokens_used": u.ai_tokens_used
        })
    return jsonify({"status": "success", "users": result})


@app.route('/admin/users/<int:user_id>/history', methods=['GET'])
def admin_get_user_history(user_id):
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    sessions_data = []
    for session in user.chat_sessions:
        messages_data = []
        for msg in session.messages:
            messages_data.append({
                "id": msg.id,
                "role": msg.role,
                "content": msg.content,
                "created_at": msg.created_at.isoformat() if msg.created_at else None
            })
        sessions_data.append({
            "id": session.id,
            "title": session.title,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "messages": messages_data
        })

    documents_data = []
    for doc in user.documents:
        documents_data.append({
            "id": doc.id,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
        })

    return jsonify({
        "status": "success",
        "user_id": user_id,
        "chat_sessions": sessions_data,
        "documents": documents_data
    })


@app.route('/admin/users/<int:user_id>/block', methods=['POST'])
def admin_toggle_block_user(user_id):
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    user = User.query.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    user.is_blocked = not user.is_blocked
    db.session.commit()
    return jsonify({
        "status": "success",
        "user_id": user_id,
        "is_blocked": user.is_blocked
    })


@app.route('/admin/documents', methods=['GET'])
def admin_get_all_documents():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    documents = Document.query.join(User, Document.user_id == User.id).all()
    result = []
    for doc in documents:
        result.append({
            "id": doc.id,
            "user_id": doc.user_id,
            "user_email": doc.user.email,
            "filename": doc.filename,
            "file_type": doc.file_type,
            "file_size": doc.file_size,
            "uploaded_at": doc.uploaded_at.isoformat() if doc.uploaded_at else None
        })
    return jsonify({"status": "success", "documents": result})


@app.route('/admin/documents/<int:doc_id>/download', methods=['GET'])
def admin_download_document(doc_id):
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    doc = Document.query.get(doc_id)
    if not doc:
        return jsonify({"status": "error", "message": "Document not found"}), 404
    if not doc.file_data:
        return jsonify({"status": "error", "message": "No file data available"}), 404
    return send_file(
        io.BytesIO(doc.file_data),
        mimetype=doc.file_type or 'application/octet-stream',
        as_attachment=True,
        download_name=doc.filename
    )


@app.route('/admin/stats', methods=['GET'])
def admin_get_stats():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    total_users = User.query.count()
    blocked_users = User.query.filter_by(is_blocked=True).count()
    total_documents = Document.query.count()
    total_chats = ChatSession.query.count()
    total_ai_calls = db.session.query(db.func.sum(User.ai_usage_count)).scalar() or 0
    return jsonify({
        "status": "success",
        "stats": {
            "total_users": total_users,
            "blocked_users": blocked_users,
            "total_documents": total_documents,
            "total_chats": total_chats,
            "total_ai_calls": total_ai_calls
        }
    })


# ---------------------------------------------------------------------------
# User utility routes
# ---------------------------------------------------------------------------

@app.route('/users/profile', methods=['GET'])
def get_user_profile():
    """Get profile for the logged-in user via their email in query params."""
    email = request.args.get('email')
    if not email:
        return jsonify({"status": "error", "message": "email is required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404

    sessions_data = []
    for s in user.chat_sessions:
        msg_count = len(s.messages)
        last_msg = s.messages[-1].created_at.isoformat() if s.messages else None
        sessions_data.append({
            "id": s.id,
            "title": s.title,
            "message_count": msg_count,
            "created_at": s.created_at.isoformat() if s.created_at else None,
            "last_message_at": last_msg,
            "messages": [
                {"role": m.role, "content": m.content, "created_at": m.created_at.isoformat() if m.created_at else None}
                for m in s.messages
            ]
        })

    docs_data = []
    for d in user.documents:
        docs_data.append({
            "id": d.id,
            "filename": d.filename,
            "file_type": d.file_type,
            "file_size": d.file_size,
            "uploaded_at": d.uploaded_at.isoformat() if d.uploaded_at else None
        })

    return jsonify({
        "status": "success",
        "user": {
            "id": user.id,
            "email": user.email,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "ai_usage_count": user.ai_usage_count,
            "ai_tokens_used": user.ai_tokens_used,
            "is_blocked": user.is_blocked,
            "total_sessions": len(sessions_data),
            "total_documents": len(docs_data),
        },
        "chat_sessions": sessions_data,
        "documents": docs_data,
    })


@app.route('/users/me/status', methods=['GET'])
def get_user_status():
    """Lightweight endpoint to check if user is still active/blocked.
    Called periodically by frontend for real-time block enforcement."""
    email = request.args.get('email')
    if not email:
        return jsonify({"status": "error", "message": "email required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    return jsonify({
        "status": "success",
        "is_blocked": user.is_blocked,
        "email": user.email,
    })


@app.route('/users/<int:user_id>/track-usage', methods=['POST'])
def track_usage(user_id):
    blocked = require_not_blocked()
    if blocked: return blocked
    user = User.query.get(user_id)
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    data = request.get_json()
    tokens = data.get('tokens', 0)
    user.ai_usage_count += 1
    user.ai_tokens_used += int(tokens)
    db.session.commit()
    return jsonify({
        "status": "success",
        "ai_usage_count": user.ai_usage_count,
        "ai_tokens_used": user.ai_tokens_used
    })


@app.route('/users/track-usage', methods=['POST'])
def track_usage_by_email():
    """Track AI usage by email — more reliable than by user ID."""
    blocked = require_not_blocked()
    if blocked: return blocked
    data = request.get_json()
    email = data.get('user_email') or request.headers.get('X-User-Email')
    tokens = int(data.get('tokens', 0))
    if not email:
        return jsonify({"status": "error", "message": "user_email required"}), 400
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    if user.is_blocked:
        return jsonify({"status": "error", "message": "Blocked", "blocked": True}), 403
    user.ai_usage_count += 1
    user.ai_tokens_used += tokens
    db.session.commit()
    return jsonify({
        "status": "success",
        "ai_usage_count": user.ai_usage_count,
        "ai_tokens_used": user.ai_tokens_used
    })


# ---------------------------------------------------------------------------
# Chat routes
# ---------------------------------------------------------------------------

@app.route('/chat/sessions', methods=['POST'])
def create_chat_session():
    blocked = require_not_blocked()
    if blocked: return blocked
    data = request.get_json()
    user_email = data.get('user_email')
    title = data.get('title', 'New Chat')
    if not user_email:
        return jsonify({"status": "error", "message": "user_email is required"}), 400
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    session = ChatSession(user_id=user.id, title=title)
    db.session.add(session)
    db.session.commit()
    return jsonify({
        "status": "success",
        "session_id": session.id,
        "title": session.title,
        "created_at": session.created_at.isoformat()
    })


@app.route('/chat/sessions/<int:session_id>/messages', methods=['POST'])
def add_chat_message(session_id):
    blocked = require_not_blocked()
    if blocked: return blocked
    session = ChatSession.query.get(session_id)
    if not session:
        return jsonify({"status": "error", "message": "Chat session not found"}), 404
    data = request.get_json()
    role = data.get('role')
    content = data.get('content')
    if not role or not content:
        return jsonify({"status": "error", "message": "role and content are required"}), 400
    if role not in ('user', 'assistant'):
        return jsonify({"status": "error", "message": "role must be 'user' or 'assistant'"}), 400
    message = ChatMessage(session_id=session_id, role=role, content=content)
    db.session.add(message)
    db.session.commit()
    return jsonify({
        "status": "success",
        "message_id": message.id,
        "session_id": session_id,
        "role": message.role,
        "created_at": message.created_at.isoformat()
    })


# ---------------------------------------------------------------------------
# Document routes
# ---------------------------------------------------------------------------

@app.route('/documents/upload', methods=['POST'])
def upload_document():
    blocked = require_not_blocked()
    if blocked: return blocked
    user_email = request.form.get('user_email')
    if not user_email:
        return jsonify({"status": "error", "message": "user_email is required"}), 400
    if 'file' not in request.files:
        return jsonify({"status": "error", "message": "No file provided"}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({"status": "error", "message": "No file selected"}), 400
    user = User.query.filter_by(email=user_email).first()
    if not user:
        return jsonify({"status": "error", "message": "User not found"}), 404
    file_data = file.read()
    doc = Document(
        user_id=user.id,
        filename=file.filename,
        file_type=file.content_type,
        file_size=len(file_data),
        file_data=file_data
    )
    db.session.add(doc)
    db.session.commit()
    return jsonify({
        "status": "success",
        "document_id": doc.id,
        "filename": doc.filename,
        "file_size": doc.file_size,
        "uploaded_at": doc.uploaded_at.isoformat()
    })


import csv
import io as _io

@app.route('/admin/change-password', methods=['POST'])
def admin_change_password():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    username = data.get('username')
    current_password = data.get('current_password')
    new_password = data.get('new_password')
    if not all([username, current_password, new_password]):
        return jsonify({"status": "error", "message": "All fields required"}), 400
    admin = AdminCredentials.query.filter_by(username=username).first()
    if not admin or not check_password_hash(admin.password_hash, current_password):
        return jsonify({"status": "error", "message": "Current password is incorrect"}), 400
    admin.password_hash = generate_password_hash(new_password)
    db.session.commit()
    return jsonify({"status": "success", "message": "Password updated successfully"})


@app.route('/admin/clear-chats', methods=['POST'])
def admin_clear_chats():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    deleted_messages = ChatMessage.query.delete()
    deleted_sessions = ChatSession.query.delete()
    db.session.commit()
    return jsonify({
        "status": "success",
        "deleted_sessions": deleted_sessions,
        "deleted_messages": deleted_messages,
    })


@app.route('/admin/export/users', methods=['GET'])
def admin_export_users():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    users = User.query.all()
    output = _io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'Email', 'Created At', 'AI Usage Count', 'AI Tokens Used', 'Is Blocked'])
    for u in users:
        writer.writerow([u.id, u.email, u.created_at, u.ai_usage_count, u.ai_tokens_used, u.is_blocked])
    output.seek(0)
    return make_response(
        output.getvalue(),
        200,
        {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=users.csv',
        }
    )


@app.route('/admin/export/documents', methods=['GET'])
def admin_export_documents():
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    docs = Document.query.all()
    output = _io.StringIO()
    writer = csv.writer(output)
    writer.writerow(['ID', 'User ID', 'Filename', 'File Type', 'File Size', 'Uploaded At'])
    for d in docs:
        writer.writerow([d.id, d.user_id, d.filename, d.file_type, d.file_size, d.uploaded_at])
    output.seek(0)
    return make_response(
        output.getvalue(),
        200,
        {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=documents.csv',
        }
    )


@app.route('/admin/api-keys', methods=['GET'])
def get_api_keys():
    """Return masked API keys so admin can see which keys are set."""
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    import os
    def mask(val):
        if not val or len(val) < 8:
            return "" 
        return val[:4] + "•" * (len(val) - 8) + val[-4:]
    return jsonify({
        "status": "success",
        "keys": {
            "groq": mask(os.environ.get("GROQ_API_KEY", "")),
            "gemini": mask(os.environ.get("GEMINI_API_KEY", "")),
        }
    })


@app.route('/admin/api-keys', methods=['POST'])
def update_api_keys():
    """Update API keys — writes to .env file."""
    if not check_admin_token():
        return jsonify({"status": "error", "message": "Unauthorized"}), 401
    data = request.get_json()
    import os, re
    env_path = os.path.join(os.path.dirname(__file__), '..', '.env')
    env_path = os.path.abspath(env_path)
    # Read existing .env
    try:
        with open(env_path, 'r') as f:
            content = f.read()
    except FileNotFoundError:
        content = ""
    # Update or add each key
    key_map = {
        "groq": "GROQ_API_KEY",
        "gemini": "GEMINI_API_KEY",
    }
    updated = []
    for field, env_key in key_map.items():
        value = data.get(field, "").strip()
        if not value:
            continue
        # Replace existing or append
        pattern = rf'^{env_key}=.*$'
        new_line = f'{env_key}={value}'
        if re.search(pattern, content, re.MULTILINE):
            content = re.sub(pattern, new_line, content, flags=re.MULTILINE)
        else:
            content = content.rstrip('\n') + f'\n{new_line}\n'
        os.environ[env_key] = value
        updated.append(env_key)
    # Write back
    with open(env_path, 'w') as f:
        f.write(content)
    return jsonify({
        "status": "success",
        "message": f"Updated: {', '.join(updated)}",
        "updated": updated
    })


if __name__ == '__main__':
    app.run(debug=True)
