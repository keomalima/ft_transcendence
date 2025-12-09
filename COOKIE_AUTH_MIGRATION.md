# Cookie-Based Authentication Migration

## Overview
The Python test script (`pong.py`) has been updated to work with the new cookie-based authentication system instead of the previous JWT token-based approach.

## What Changed in the Backend

### Before (JWT Tokens)
```typescript
// Backend returned tokens in response body
{
  "accessToken": "eyJhbGc...",
  "id": "user-id",
  ...
}

// Frontend stored and sent token in headers
headers: { "Authorization": "Bearer <token>" }
```

### After (Session Cookies)
```typescript
// Backend sets httpOnly cookie
reply.setCookie('sessionId', session.id, {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? 'none' : 'lax',
  path: '/',
  maxAge: 60 * 60 * 24,
})

// Cookie is automatically sent with each request
// No Authorization header needed
```

## Changes Made to pong.py

### 1. User Class - Added Session Management
```python
class User:
    def __init__(self, ...):
        # ...existing fields...
        # NEW: Session to persist cookies across requests
        self.session = requests.Session()
```

Each `User` instance now has its own `requests.Session()` object that:
- Automatically stores cookies received from the server
- Automatically sends cookies with each subsequent request
- Maintains authentication state without manual token management

### 2. Login Method - Cookie Storage
```python
def login(self) -> bool:
    """Login user. Returns True if successful. Cookie is stored in session."""
    data = {"email": self.email, "password": self.password}
    resp = self.session.post(f"{BASE_URL}/login", json=data, timeout=5)
    # Cookie is automatically stored in self.session
```

**Key Changes:**
- Removed: `self.token = json_data.get("accessToken")`
- Added: Cookie is automatically stored by the session
- Session cookies persist for all subsequent requests

### 3. Logout Method - Cookie Cleanup
```python
def logout(self) -> bool:
    """Logout user. Returns True if successful."""
    resp = self.session.post(f"{BASE_URL}/logout", timeout=5)
    # Clear the session cookies
    self.session.cookies.clear()
```

**Key Changes:**
- Removed: Token validation checks
- Removed: Authorization headers
- Added: Explicit cookie clearing after logout

### 4. All Protected Methods - Removed Authorization Headers
All methods that require authentication have been updated:

**Before:**
```python
def send_friend_request(self, target_display_name: str) -> bool:
    if not self.token:
        return False
    headers = {"Authorization": f"Bearer {self.token}"}
    resp = requests.post(FRIENDS_URL, json=data, headers=headers)
```

**After:**
```python
def send_friend_request(self, target_display_name: str) -> bool:
    # No token check needed - session handles it
    resp = self.session.post(FRIENDS_URL, json=data)
```

Methods updated:
- `register()` - Uses session for consistency
- `send_friend_request()`
- `accept_friend_request()`
- `reject_friend_request()`
- `delete_friend()`
- `get_friends()`
- `get_pending_requests()`
- `create_game()`
- `get_game()`
- `update_game()`
- `generate_game_token()`
- `join_game()`
- `start_game()`

### 5. Utility Functions - No Changes Needed
Functions that don't require authentication remain unchanged:
- `fetch_existing_users()` - Public endpoint
- `clean_database()` - Public/dev endpoint

## How It Works Now

### Authentication Flow
1. **Login**: User logs in → Backend creates session → Cookie set in user's session object
2. **Authenticated Requests**: All subsequent requests automatically include the cookie
3. **Logout**: Logout endpoint called → Backend invalidates session → Client clears cookies

### Session Persistence
```python
user = User("test@example.com", "password", "Test", "User", "TestUser")

# Login - cookie is stored
user.login()  

# All these requests automatically use the cookie
user.send_friend_request("OtherUser")
user.create_game()
user.get_friends()

# Logout - cookie is cleared
user.logout()
```

### Multiple Users
Each `User` instance maintains its own session:
```python
user1 = User(...)
user2 = User(...)

user1.login()  # user1's session gets cookie
user2.login()  # user2's session gets a different cookie

user1.send_friend_request("user2")  # Uses user1's cookie
user2.accept_friend_request(id)     # Uses user2's cookie
```

## Benefits of Cookie-Based Auth

1. **Security**: 
   - httpOnly cookies can't be accessed by JavaScript (XSS protection)
   - Secure flag for HTTPS-only transmission in production

2. **Automatic Management**:
   - No need to manually attach tokens to headers
   - Browser/session handles cookie storage and transmission

3. **Better Session Control**:
   - Backend has full control over session lifecycle
   - Can invalidate sessions server-side

4. **Simpler Code**:
   - No token validation checks in client code
   - No header management

## Testing the Changes

Run the script as usual:
```bash
python pong.py
```

All functionality should work the same way, but now using cookies instead of tokens under the hood.

## Troubleshooting

### Issue: "Unauthorized" errors
- Make sure you're calling `login()` before any authenticated operations
- Check that the backend is running and accessible
- Verify that cookies are not being blocked

### Issue: Session not persisting
- Ensure you're using the same `User` instance for related operations
- Don't create new `User` objects - reuse the logged-in ones

### Issue: Cross-user operations failing
- Remember each `User` has its own session
- Don't share session objects between users
