import os
import requests
import random
import string
from typing import List, Optional

# ANSI color codes
RED = "\033[91m"
GREEN = "\033[92m"
YELLOW = "\033[93m"
CYAN = "\033[96m"
MAGENTA = "\033[95m"
BLUE = "\033[94m"
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

ASCII_BANNER = f"""pas
{CYAN}{BOLD}
 ____  ____   __   __ _  ____   ___  ____  __ _  ____  ____  __ _   ___  ____ 
(_  _)(  _ \ / _\ (  ( \/ ___) / __)(  __)(  ( \(    \(  __)(  ( \ / __)(  __)
  )(   )   //    \/    /\___ \( (__  ) _) /    / ) D ( ) _) /    /( (__  ) _) 
 (__) (__\_)\_/\_/\_)__)(____/ \___)(____)\_)__)(____/(____)\_)__) \___)(____)
 
{RESET}
"""

BASE_URL = "http://localhost:3000/api/users"
FRIENDS_URL = "http://localhost:3000/api/friends"
GAME_URL = "http://localhost:3000/api/games"
TOURNAMENT_URL = "http://localhost:3000/api/tournaments"

class User:
    def __init__(self, email: str, password: str, name: str, surname: str, 
                 display_name: str, user_id: Optional[int] = None, 
                 token: Optional[str] = None, is_online: bool = False):
        self.email = email
        self.password = password
        self.name = name
        self.surname = surname
        self.display_name = display_name
        self.token = token  # Deprecated: kept for backwards compatibility
        self.user_id = user_id
        self.is_online = is_online
        # Session to persist cookies across requests
        self.session = requests.Session()

    def register(self) -> bool:
        """Register a new user. Returns True if successful."""
        data = {
            "email": self.email,
            "name": self.name,
            "surname": self.surname,
            "displayName": self.display_name,
            "password": self.password,
            "avatarUrl": None
        }
        try:
            resp = self.session.post(f"{BASE_URL}/", json=data, timeout=5)
            if resp.status_code == 201:
                print(f"{GREEN}✓{RESET} Registered {self.email}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to register {self.email}: {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error during registration: {e}")
            return False

    def login(self) -> bool:
        """Login user. Returns True if successful. Cookie is stored in session."""
        data = {"email": self.email, "password": self.password}
        try:
            resp = self.session.post(f"{BASE_URL}/login", json=data, timeout=5)
            if resp.status_code in (200, 201):
                json_data = resp.json()
                # Cookie is automatically stored in self.session
                self.user_id = json_data.get("id")
                self.token = "session"

                # Fix: If backend sends Secure cookies (production mode), requests won't send them over HTTP.
                # We manually force the sessionId cookie to be non-secure for localhost testing.
                for cookie in self.session.cookies:
                    if cookie.name == "sessionId":
                        cookie.secure = False

                print(f"{GREEN}✓{RESET} Logged in {self.email} (session cookie stored)")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to login {self.email}: {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error during login: {e}")
            return False

    def logout(self) -> bool:
        """Logout user. Returns True if successful."""
        try:
            resp = self.session.post(f"{BASE_URL}/logout", timeout=5)
            if resp.status_code in (200, 204):
                print(f"{GREEN}✓{RESET} Logged out {self.email}")
                # Clear the session cookies
                self.session.cookies.clear()
                self.token = None
                return True
            else:
                print(f"{YELLOW}⚠{RESET} Logout {self.email}: {resp.status_code}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error during logout: {e}")
            return False

    def send_friend_request(self, target_display_name: str) -> bool:
        """Send friend request to another user. Returns True if successful."""
        data = {"addresseeDisplayName": target_display_name}
        try:
            resp = self.session.post(FRIENDS_URL, json=data, timeout=5)
            if resp.status_code == 201:
                print(f"{GREEN}✓{RESET} Friend request sent from {self.display_name} to {target_display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Friend request to {target_display_name} failed: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error during friend request: {e}")
            return False

    def accept_friend_request(self, friendship_id: str) -> bool:
        """Accept a friend request. Returns True if successful."""
        try:
            resp = self.session.put(f"{FRIENDS_URL}/accept/{friendship_id}", timeout=5)
            if resp.status_code == 200:
                print(f"{GREEN}✓{RESET} Friend request accepted by {self.display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to accept friend request: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while accepting friend request: {e}")
            return False

    def reject_friend_request(self, friendship_id: str) -> bool:
        """Reject a friend request. Returns True if successful."""
        try:
            resp = self.session.put(f"{FRIENDS_URL}/reject/{friendship_id}", timeout=5)
            if resp.status_code == 204:
                print(f"{GREEN}✓{RESET} Friend request rejected by {self.display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to reject friend request: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while rejecting friend request: {e}")
            return False

    def delete_friend(self, friendship_id: str) -> bool:
        """Delete an active friendship. Returns True if successful."""
        try:
            resp = self.session.delete(f"{FRIENDS_URL}/{friendship_id}", timeout=5)
            if resp.status_code == 204:
                print(f"{GREEN}✓{RESET} Friendship deleted by {self.display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to delete friendship: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while deleting friendship: {e}")
            return False

    def get_friends(self) -> Optional[List[dict]]:
        """Get user's active friends list with online status. Returns list of friends if successful."""
        try:
            resp = self.session.get(FRIENDS_URL, timeout=5)
            if resp.status_code == 200:
                friends = resp.json()
                # Friends list now includes isOnline status from the backend
                return friends
            elif resp.status_code == 404:
                return []  # No friends found
            else:
                print(f"{RED}✗{RESET} Failed to get friends: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching friends: {e}")
            return None

    def get_pending_requests(self) -> Optional[List[dict]]:
        """Get user's pending friend requests. Returns list of pending requests if successful."""
        try:
            resp = self.session.get(f"{FRIENDS_URL}/requests", timeout=5)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                return []  # No pending requests
            else:
                print(f"{RED}✗{RESET} Failed to get pending requests: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching pending requests: {e}")
            return None

    # =====================
    # Game Methods
    # =====================

    def create_game(self, game_type: str = "ONLINE", score_to_win: Optional[int] = None) -> Optional[dict]:
        """Create a new game. Returns game data if successful."""
        data = {"type": game_type}
        if score_to_win is not None:
            data["scoreToWin"] = score_to_win
        
        try:
            resp = self.session.post(GAME_URL, json=data, timeout=5)
            if resp.status_code == 201:
                game = resp.json()
                print(f"{GREEN}✓{RESET} Game created by {self.display_name} (ID: {game.get('id', 'N/A')})")
                return game
            else:
                print(f"{RED}✗{RESET} Failed to create game: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while creating game: {e}")
            return None

    def get_game(self, game_id: str) -> Optional[dict]:
        """Get game details by ID. Returns game data if successful."""
        try:
            resp = self.session.get(f"{GAME_URL}/{game_id}", timeout=5)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                print(f"{YELLOW}⚠{RESET} Game not found")
                return None
            else:
                print(f"{RED}✗{RESET} Failed to get game: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching game: {e}")
            return None

    def update_game(self, game_id: str, score_to_win: int) -> Optional[dict]:
        """Update game settings. Returns updated game data if successful."""
        data = {"scoreToWin": score_to_win}
        
        try:
            resp = self.session.put(f"{GAME_URL}/{game_id}", json=data, timeout=5)
            if resp.status_code == 200:
                game = resp.json()
                print(f"{GREEN}✓{RESET} Game updated by {self.display_name}")
                return game
            else:
                print(f"{RED}✗{RESET} Failed to update game: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while updating game: {e}")
            return None

    def generate_game_token(self, game_id: str) -> Optional[str]:
        """Generate a token for a game. Returns token if successful."""
        try:
            resp = self.session.post(f"{GAME_URL}/{game_id}/token", timeout=5)
            if resp.status_code == 200:
                game = resp.json()
                token = game.get('token')
                print(f"{GREEN}✓{RESET} Game token generated: {BOLD}{token}{RESET}")
                return token
            else:
                print(f"{RED}✗{RESET} Failed to generate token: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while generating token: {e}")
            return None

    def join_game(self, token: str) -> Optional[dict]:
        """Join a game using a token. Returns join data if successful."""
        try:
            resp = self.session.post(f"{GAME_URL}/{token}/join", timeout=5)
            if resp.status_code == 200:
                result = resp.json()
                print(f"{GREEN}✓{RESET} {self.display_name} joined the game")
                return result
            else:
                print(f"{RED}✗{RESET} Failed to join game: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while joining game: {e}")
            return None

    def start_game(self, game_id: str) -> Optional[dict]:
        """Start a game. Returns game data if successful."""
        try:
            resp = self.session.put(f"{GAME_URL}/{game_id}/start", timeout=5)
            if resp.status_code == 200:
                game = resp.json()
                print(f"{GREEN}✓{RESET} Game started by {self.display_name}")
                return game
            else:
                print(f"{RED}✗{RESET} Failed to start game: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while starting game: {e}")
            return None

    # =====================
    # Tournament Methods
    # =====================

    def create_tournament(self, number_players: int = 8, score_to_win: int = 10) -> Optional[dict]:
        """Create a new tournament. Returns tournament data if successful."""
        data = {
            "numberPlayers": number_players,
            "scoreToWin": score_to_win
        }
        
        try:
            resp = self.session.post(TOURNAMENT_URL, json=data, timeout=5)
            if resp.status_code == 201:
                tournament = resp.json()
                print(f"{GREEN}✓{RESET} Tournament created by {self.display_name} (ID: {tournament.get('id', 'N/A')})")
                return tournament
            else:
                print(f"{RED}✗{RESET} Failed to create tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while creating tournament: {e}")
            return None

    def get_tournament(self, tournament_id: str) -> Optional[dict]:
        """Get tournament details by ID. Returns tournament data if successful."""
        try:
            resp = self.session.get(f"{TOURNAMENT_URL}/{tournament_id}", timeout=5)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                print(f"{YELLOW}⚠{RESET} Tournament not found")
                return None
            else:
                print(f"{RED}✗{RESET} Failed to get tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching tournament: {e}")
            return None

    def generate_tournament_token(self, tournament_id: str) -> Optional[str]:
        """Generate a token for a tournament. Returns token if successful."""
        try:
            resp = self.session.post(f"{TOURNAMENT_URL}/{tournament_id}/token", timeout=5)
            if resp.status_code == 200:
                tournament = resp.json()
                token = tournament.get('token')
                print(f"{GREEN}✓{RESET} Tournament token generated: {BOLD}{token}{RESET}")
                return token
            else:
                print(f"{RED}✗{RESET} Failed to generate token: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while generating token: {e}")
            return None

    def join_tournament(self, token: str) -> Optional[dict]:
        """Join a tournament using a token. Returns join data if successful."""
        try:
            resp = self.session.post(f"{TOURNAMENT_URL}/{token}/join", timeout=5)
            if resp.status_code == 200:
                result = resp.json()
                print(f"{GREEN}✓{RESET} {self.display_name} joined the tournament")
                return result
            else:
                print(f"{RED}✗{RESET} Failed to join tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while joining tournament: {e}")
            return None

    def start_tournament(self, tournament_id: str) -> Optional[dict]:
        """Start a tournament. Returns tournament data if successful."""
        try:
            resp = self.session.put(f"{TOURNAMENT_URL}/{tournament_id}/start", timeout=5)
            if resp.status_code == 200:
                tournament = resp.json()
                print(f"{GREEN}✓{RESET} Tournament started by {self.display_name}")
                return tournament
            else:
                print(f"{RED}✗{RESET} Failed to start tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while starting tournament: {e}")
            return None

    def get_current_tournament(self) -> Optional[dict]:
        """Get the current pending/active tournament for the user. Returns tournament data if successful."""
        try:
            resp = self.session.get(f"{TOURNAMENT_URL}/current", timeout=5)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                print(f"{YELLOW}⚠{RESET} No current tournament")
                return None
            else:
                print(f"{RED}✗{RESET} Failed to get current tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching current tournament: {e}")
            return None

    def delete_tournament(self, tournament_id: str) -> bool:
        """Delete a pending tournament or quit it if user is not the creator. Returns True if successful."""
        try:
            resp = self.session.delete(f"{TOURNAMENT_URL}/{tournament_id}", timeout=5)
            if resp.status_code == 204:
                print(f"{GREEN}✓{RESET} Tournament deleted/quit by {self.display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to delete tournament: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while deleting tournament: {e}")
            return False

    def remove_tournament_player(self, tournament_id: str, player_id: str) -> bool:
        """Remove a player from a pending tournament. Returns True if successful."""
        data = {"playerId": player_id}
        try:
            resp = self.session.put(f"{TOURNAMENT_URL}/{tournament_id}/remove", json=data, timeout=5)
            if resp.status_code in (200, 204):
                print(f"{GREEN}✓{RESET} Player removed from tournament by {self.display_name}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to remove player: {resp.status_code} - {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while removing player: {e}")
            return False

    def match_make_tournament(self, tournament_id: str) -> Optional[dict]:
        """Match make a tournament. Returns tournament data if successful."""
        try:
            resp = self.session.post(f"{TOURNAMENT_URL}/{tournament_id}/match-make", timeout=5)
            if resp.status_code == 200:
                tournament = resp.json()
                print(f"{GREEN}✓{RESET} Tournament match-making completed by {self.display_name}")
                return tournament
            else:
                print(f"{RED}✗{RESET} Failed to match-make tournament: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while match-making tournament: {e}")
            return None

    def get_tournament_games(self, tournament_id: str) -> Optional[List[dict]]:
        """Get all games in a tournament. Returns list of games if successful."""
        try:
            resp = self.session.get(f"{TOURNAMENT_URL}/{tournament_id}/tournament-games", timeout=5)
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 404:
                print(f"{YELLOW}⚠{RESET} No games found for tournament")
                return []
            else:
                print(f"{RED}✗{RESET} Failed to get tournament games: {resp.status_code} - {resp.text}")
                return None
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error while fetching tournament games: {e}")
            return None



def generate_random_string(length: int = 8) -> str:
    """Generate a random string of letters."""
    return ''.join(random.choices(string.ascii_lowercase, k=length))

def generate_random_user() -> User:
    """Generate a user with random credentials."""
    rand_str = generate_random_string(6)
    email = f"{rand_str}@test.com"
    name = rand_str.capitalize()
    surname = generate_random_string(6).capitalize()
    display_name = f"{name}{random.randint(100, 999)}"
    return User(email, "password123", name, surname, display_name)

def fetch_existing_users() -> List[User]:
    """Fetch existing users from the database."""
    try:
        resp = requests.get(BASE_URL, timeout=5)
        users = []
        if resp.status_code == 200:
            for u in resp.json():
                user = User(
                    email=u.get("email"),
                    password="password123",
                    name=u.get("name"),
                    surname=u.get("surname"),
                    display_name=u.get("displayName"),
                    user_id=u.get("id"),
                    is_online=u.get("isOnline", False)
                )
                users.append(user)
            print(f"{CYAN}✓{RESET} Fetched {len(users)} existing users from the database")
        else:
            print(f"{RED}✗{RESET} Failed to fetch users: {resp.status_code}")
        return users
    except requests.exceptions.RequestException as e:
        print(f"{RED}✗{RESET} Network error while fetching users: {e}")
        return []

def login_manual(users: List[User]) -> List[User]:
    """Login a user with manual email and password input."""
    print(f"\n{BOLD}Manual Login{RESET}")
    print("-" * 40)
    
    email = input(f"Email: ").strip()
    if not email or '@' not in email:
        print(f"{RED}✗{RESET} Invalid email format")
        return users
    
    password = input(f"Password: ").strip()
    if not password:
        print(f"{RED}✗{RESET} Password is required")
        return users
    
    # Check if user already exists in our local list
    existing_user = next((u for u in users if u.email == email), None)
    
    if existing_user:
        # Update the password and try to login
        existing_user.password = password
        if existing_user.login():
            print(f"{GREEN}✓{RESET} User logged in successfully!")
        else:
            print(f"{RED}✗{RESET} Login failed - check credentials")
    else:
        # Create a new user object with manual credentials (user must already exist in DB)
        user = User(email, password, "", "", "")
        if user.login():
            # Fetch additional user details from the login response
            # The login method already sets user_id
            users.append(user)
            print(f"{GREEN}✓{RESET} User logged in successfully!")
        else:
            print(f"{RED}✗{RESET} Login failed - check credentials")
    
    return users

def create_manual_user(users: List[User]) -> List[User]:
    """Create a single user with manual input."""
    print(f"\n{BOLD}Manual User Creation{RESET}")
    print("-" * 40)
    
    email = input(f"Email: ").strip()
    if not email or '@' not in email:
        print(f"{RED}✗{RESET} Invalid email format")
        return users
    
    if any(u.email == email for u in users):
        print(f"{YELLOW}⚠{RESET} User with email {email} already exists")
        return users
    
    password = input(f"Password (default: password123): ").strip() or "password123"
    name = input(f"Name: ").strip()
    surname = input(f"Surname: ").strip()
    display_name = input(f"Display Name: ").strip()
    
    if not all([name, surname, display_name]):
        print(f"{RED}✗{RESET} All fields are required")
        return users
    
    user = User(email, password, name, surname, display_name)
    if user.register():
        if user.login():
            users.append(user)
            print(f"{GREEN}✓{RESET} User created and logged in successfully!")
    
    return users

def create_random_users(n: int, users: List[User]) -> List[User]:
    """Create n random users."""
    print(f"\n{CYAN}Creating {n} random users...{RESET}")
    
    for i in range(n):
        user = generate_random_user()
        while any(u.email == user.email for u in users):
            user = generate_random_user()
        
        if user.register():
            if user.login():
                users.append(user)
    
    print(f"{GREEN}✓{RESET} Successfully created {n} random users")
    return users

def display_users(users: List[User]) -> None:
    """Display all users in a formatted table."""
    print(f"\n{BOLD}Users List{RESET}")
    print("-" * 100)
    
    if not users:
        print(f"{YELLOW}No users to display{RESET}\n")
        return
    
    for idx, user in enumerate(users):
        status = f"{GREEN}●{RESET}" if user.token else f"{DIM}○{RESET}"
        id_str = str(user.user_id) if user.user_id else "N/A"
        print(f"{status} [{idx:2d}] Email: {user.email:25s} Display: {user.display_name:15s} ID: {id_str}")
    
    print(f"\n{DIM}{GREEN}●{RESET}{DIM} = Logged in  ○ = Logged out{RESET}\n")

def display_user_friends(user: User) -> None:
    """Display all friends and pending requests of a specific user."""
    friends = user.get_friends()
    pending_requests = user.get_pending_requests()
    
    print(f"\n{BOLD}Friends of {user.display_name}{RESET}")
    print("-" * 80)
    
    # Display active friends with online status
    if friends:
        print(f"\n{GREEN}Active Friends:{RESET}")
        for friend in friends:
            display = friend.get('displayName', 'Unknown')
            user_id = friend.get('id', 'N/A')
            friendship_id = friend.get('friendshipId', 'N/A')
            is_online = friend.get('isOnline', False)
            
            # Show online status indicator
            status_icon = f"{GREEN}●{RESET}" if is_online else f"{DIM}○{RESET}"
            status_text = f"{GREEN}Online{RESET}" if is_online else f"{DIM}Offline{RESET}"
            
            print(f"  {status_icon} {display} (User ID: {user_id}) - {status_text} - Friendship ID: {friendship_id}")
    else:
        print(f"\n{DIM}No active friends{RESET}")
    
    # Display pending requests
    if pending_requests:
        print(f"\n{CYAN}Pending Friend Requests:{RESET}")
        for req in pending_requests:
            friend = req.get('friend', {})
            display = friend.get('displayName', 'Unknown')
            req_id = req.get('id', 'N/A')
            created_at = req.get('createdAt', 'Unknown')
            print(f"  • {display} - Request ID: {req_id}")
    else:
        print(f"\n{DIM}No pending requests{RESET}")
    
    print(f"\n{DIM}{GREEN}●{RESET}{DIM} = Online  ○ = Offline{RESET}\n")

def clean_database() -> bool:
    """Clean the database. Returns True if successful."""
    try:
        resp = requests.delete(f"{BASE_URL}/clean", timeout=5)
        if resp.status_code == 200:
            print(f"{GREEN}✓{RESET} Database cleaned successfully")
            return True
        else:
            print(f"{RED}✗{RESET} Failed to clean database: {resp.status_code} {resp.text}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"{RED}✗{RESET} Network error during database cleanup: {e}")
        return False

def login_all_users(users: List[User]) -> None:
    """Login all users in the list."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users to login")
        return
    
    print(f"\n{CYAN}Logging in all users...{RESET}")
    for user in users:
        if not user.token:
            user.login()
        else:
            print(f"{DIM}{user.email} already logged in{RESET}")

def clear_terminal() -> None:
    """Clear the terminal screen."""
    os.system('clear' if os.name != 'nt' else 'cls')

def get_int_input(prompt: str) -> Optional[int]:
    """Get integer input from user with error handling."""
    try:
        return int(input(f"{prompt} "))
    except ValueError:
        print(f"{RED}✗{RESET} Invalid input. Please enter a number")
        return None

def create_mock_scenario(users: List[User]) -> List[User]:
    """Create a mock data scenario with users and friendships."""
    print(f"\n{CYAN}{BOLD}Creating Mock Data Scenario...{RESET}")
    print(f"{DIM}This will create 10 users with various friendship relationships{RESET}\n")
    
    # Define mock users
    mock_users_data = [
        {"email": "alice@test.com", "name": "Alice", "surname": "Smith", "display": "AliceSmith"},
        {"email": "bob@test.com", "name": "Bob", "surname": "Johnson", "display": "BobJohnson"},
        {"email": "charlie@test.com", "name": "Charlie", "surname": "Brown", "display": "CharlieBrown"},
        {"email": "diana@test.com", "name": "Diana", "surname": "Williams", "display": "DianaWilliams"},
        {"email": "eve@test.com", "name": "Eve", "surname": "Davis", "display": "EveDavis"},
        {"email": "frank@test.com", "name": "Frank", "surname": "Miller", "display": "FrankMiller"},
        {"email": "grace@test.com", "name": "Grace", "surname": "Wilson", "display": "GraceWilson"},
        {"email": "henry@test.com", "name": "Henry", "surname": "Moore", "display": "HenryMoore"},
        {"email": "iris@test.com", "name": "Iris", "surname": "Taylor", "display": "IrisTaylor"},
        {"email": "jack@test.com", "name": "Jack", "surname": "Anderson", "display": "JackAnderson"},
    ]
    
    # Create users
    print(f"{CYAN}Step 1: Creating users...{RESET}")
    created_users = []
    for user_data in mock_users_data:
        # Check if user already exists
        if any(u.email == user_data["email"] for u in users):
            print(f"{YELLOW}⚠{RESET} User {user_data['email']} already exists, skipping...")
            # Find and use existing user
            existing = next(u for u in users if u.email == user_data["email"])
            if not existing.token:
                existing.login()
            created_users.append(existing)
            continue
        
        user = User(
            email=user_data["email"],
            password="password123",
            name=user_data["name"],
            surname=user_data["surname"],
            display_name=user_data["display"]
        )
        
        if user.register() and user.login():
            users.append(user)
            created_users.append(user)
        else:
            print(f"{RED}✗{RESET} Failed to create user {user_data['email']}")
            return users
    
    print(f"{GREEN}✓{RESET} All users created and logged in\n")
    
    # Create friendships
    print(f"{CYAN}Step 2: Creating friendships...{RESET}")
    
    # Scenario with more diverse friendships:
    # Alice: friends with Bob, Charlie, Diana, Frank (4 friends) + pending from Grace
    # Bob: friends with Alice, Eve, Henry (3 friends) + pending request to Iris
    # Charlie: friends with Alice, Diana (2 friends) + pending from Jack
    # Diana: friends with Alice, Charlie, Frank (3 friends)
    # Eve: friends with Bob, Frank (2 friends) + pending to Henry
    # Frank: friends with Alice, Diana, Eve, Grace (4 friends)
    # Grace: friends with Frank (1 friend) + pending to Alice
    # Henry: friends with Bob (1 friend) + pending from Eve
    # Iris: no friends yet + pending from Bob
    # Jack: no friends yet + pending to Charlie
    
    alice, bob, charlie, diana, eve, frank, grace, henry, iris, jack = created_users[0:10]
    
    import time
    
    def send_and_accept(sender: User, receiver: User):
        """Helper to send and accept friend request."""
        print(f"{DIM}  Creating friendship: {sender.display_name} ↔ {receiver.display_name}{RESET}")
        sender.send_friend_request(receiver.display_name)
        time.sleep(0.3)
        pending = receiver.get_pending_requests()
        if pending:
            for req in pending:
                if req.get('friend', {}).get('displayName') == sender.display_name:
                    receiver.accept_friend_request(req.get('id'))
                    break
        time.sleep(0.3)
    
    def send_pending(sender: User, receiver: User):
        """Helper to send pending friend request (not accepted)."""
        print(f"{DIM}  Creating pending: {sender.display_name} → {receiver.display_name}{RESET}")
        sender.send_friend_request(receiver.display_name)
        time.sleep(0.3)
    
    # Alice's friendships
    send_and_accept(alice, bob)
    send_and_accept(alice, charlie)
    send_and_accept(alice, diana)
    send_and_accept(alice, frank)
    
    # Bob's friendships
    send_and_accept(bob, eve)
    send_and_accept(bob, henry)
    
    # Charlie's friendships
    send_and_accept(charlie, diana)
    
    # Eve's friendships
    send_and_accept(eve, frank)
    
    # Frank's friendships
    send_and_accept(frank, grace)
    
    # Pending requests (not accepted)
    send_pending(grace, alice)
    send_pending(bob, iris)
    send_pending(eve, henry)
    send_pending(jack, charlie)
    
    print(f"\n{GREEN}✓{RESET} Mock scenario created successfully!\n")
    
    # # Create games
    # print(f"{CYAN}Step 3: Creating games...{RESET}")
    
    # games_data = []
    
    # # Game 1: Alice creates an ONLINE game, generates token, Bob joins, Alice starts
    # print(f"{DIM}  Creating ONLINE game: Alice vs Bob{RESET}")
    # game1 = alice.create_game("ONLINE", 10)
    # if game1:
    #     time.sleep(0.3)
    #     token1 = alice.generate_game_token(game1['id'])
    #     if token1:
    #         time.sleep(0.3)
    #         bob.join_game(token1)
    #         time.sleep(0.3)
    #         alice.start_game(game1['id'])
    #         games_data.append({
    #             'id': game1['id'],
    #             'type': 'ONLINE',
    #             'status': 'IN_PROGRESS',
    #             'players': ['Alice', 'Bob'],
    #             'token': token1
    #         })
    #         time.sleep(0.3)
    
    # # Game 2: Charlie creates a LOCAL game
    # print(f"{DIM}  Creating LOCAL game: Charlie (practice mode){RESET}")
    # game2 = charlie.create_game("LOCAL", 5)
    # if game2:
    #     games_data.append({
    #         'id': game2['id'],
    #         'type': 'LOCAL',
    #         'status': 'PENDING',
    #         'players': ['Charlie'],
    #         'token': None
    #     })
    #     time.sleep(0.3)
    
    # # Game 3: Diana creates an ONLINE game, generates token, Frank joins, Diana starts
    # print(f"{DIM}  Creating ONLINE game: Diana vs Frank{RESET}")
    # game3 = diana.create_game("ONLINE", 7)
    # if game3:
    #     time.sleep(0.3)
    #     token3 = diana.generate_game_token(game3['id'])
    #     if token3:
    #         time.sleep(0.3)
    #         frank.join_game(token3)
    #         time.sleep(0.3)
    #         diana.start_game(game3['id'])
    #         games_data.append({
    #             'id': game3['id'],
    #             'type': 'ONLINE',
    #             'status': 'IN_PROGRESS',
    #             'players': ['Diana', 'Frank'],
    #             'token': token3
    #         })
    #         time.sleep(0.3)
    
    # # Game 4: Eve creates a TOURNAMENT game (pending)
    # print(f"{DIM}  Creating TOURNAMENT game: Eve (waiting for players){RESET}")
    # game4 = eve.create_game("TOURNAMENT", 10)
    # if game4:
    #     time.sleep(0.3)
    #     token4 = eve.generate_game_token(game4['id'])
    #     games_data.append({
    #         'id': game4['id'],
    #         'type': 'TOURNAMENT',
    #         'status': 'PENDING',
    #         'players': ['Eve'],
    #         'token': token4
    #     })
    #     time.sleep(0.3)
    
    # # Game 5: Grace creates an ONLINE game and generates token (waiting for opponent)
    # print(f"{DIM}  Creating ONLINE game: Grace (waiting for opponent){RESET}")
    # game5 = grace.create_game("ONLINE", 10)
    # if game5:
    #     time.sleep(0.3)
    #     token5 = grace.generate_game_token(game5['id'])
    #     games_data.append({
    #         'id': game5['id'],
    #         'type': 'ONLINE',
    #         'status': 'PENDING',
    #         'players': ['Grace'],
    #         'token': token5
    #     })
    #     time.sleep(0.3)
    
    # # Game 6: Henry creates an ONLINE game, Iris joins (ready to start)
    # print(f"{DIM}  Creating ONLINE game: Henry vs Iris (ready to start){RESET}")
    # game6 = henry.create_game("ONLINE", 9)
    # if game6:
    #     time.sleep(0.3)
    #     token6 = henry.generate_game_token(game6['id'])
    #     if token6:
    #         time.sleep(0.3)
    #         iris.join_game(token6)
    #         games_data.append({
    #             'id': game6['id'],
    #             'type': 'ONLINE',
    #             'status': 'PENDING',
    #             'players': ['Henry', 'Iris'],
    #             'token': token6
    #         })
    #         time.sleep(0.3)
    
    # print(f"\n{GREEN}✓{RESET} Games created successfully!\n")
    
    # Create tournaments
    print(f"{CYAN}Step 4: Creating tournaments...{RESET}")
    
    tournaments_data = []
    
    # Tournament 1: Alice creates an 8-player tournament, all players join, ready to start
    print(f"{DIM}  Creating 8-player tournament: Alice (fully filled, ready to start){RESET}")
    tournament1 = alice.create_tournament(4, 2)
    if tournament1:
        time.sleep(0.3)
        token_t1 = alice.generate_tournament_token(tournament1['id'])
        if token_t1:
            time.sleep(0.3)
            bob.join_tournament(token_t1)
            time.sleep(0.3)
            charlie.join_tournament(token_t1)
            time.sleep(0.3)
            diana.join_tournament(token_t1)
            tournaments_data.append({
                'id': tournament1['id'],
                'status': 'PENDING',
                'players': 4,
                'joined': ['Alice', 'Bob', 'Charlie', 'Diana'],
                'token': token_t1,
                'scoreToWin': 10
            })
            time.sleep(0.3)
    
    # Tournament 2: Jack creates a 4-player tournament and generates token (waiting for players)
    print(f"{DIM}  Creating 4-player tournament: Jack (waiting for players){RESET}")
    tournament2 = jack.create_tournament(4, 7)
    if tournament2:
        time.sleep(0.3)
        token_t2 = jack.generate_tournament_token(tournament2['id'])
        tournaments_data.append({
            'id': tournament2['id'],
            'status': 'PENDING',
            'players': 4,
            'joined': ['Jack'],
            'token': token_t2,
            'scoreToWin': 7
        })
        time.sleep(0.3)
    
    # Tournament 3: Frank creates an 8-player tournament, multiple join, then he starts it
    print(f"{DIM}  Creating 8-player tournament: Frank (fully filled and started){RESET}")
    tournament3 = frank.create_tournament(8, 3)
    if tournament3:
        time.sleep(0.3)
        token_t3 = frank.generate_tournament_token(tournament3['id'])
        if token_t3:
            time.sleep(0.3)
            grace.join_tournament(token_t3)
            time.sleep(0.3)
            henry.join_tournament(token_t3)
            time.sleep(0.3)
            iris.join_tournament(token_t3)
            time.sleep(0.3)
            eve.join_tournament(token_t3)
            time.sleep(0.3)
            alice.join_tournament(token_t3)
            time.sleep(0.3)
            bob.join_tournament(token_t3)
            time.sleep(0.3)
            charlie.join_tournament(token_t3)
            time.sleep(0.3)
            # Now Frank starts the tournament
            frank.start_tournament(tournament3['id'])
            tournaments_data.append({
                'id': tournament3['id'],
                'status': 'IN_PROGRESS',
                'players': 8,
                'joined': ['Frank', 'Grace', 'Henry', 'Iris', 'Eve', 'Alice', 'Bob', 'Charlie'],
                'token': None,
                'scoreToWin': 10
            })
            time.sleep(0.3)
    
    print(f"\n{GREEN}✓{RESET} Tournaments created successfully!\n")
    
    # Display summary
    print(f"{CYAN}{BOLD}Mock Scenario Summary:{RESET}")
    print(f"\n{GREEN}Active Friendships:{RESET}")
    print(f"  • Alice ↔ Bob, Charlie, Diana, Frank (4 friends)")
    print(f"  • Bob ↔ Alice, Eve, Henry (3 friends)")
    print(f"  • Charlie ↔ Alice, Diana (2 friends)")
    print(f"  • Diana ↔ Alice, Charlie, Frank (3 friends)")
    print(f"  • Eve ↔ Bob, Frank (2 friends)")
    print(f"  • Frank ↔ Alice, Diana, Eve, Grace (4 friends)")
    print(f"  • Grace ↔ Frank (1 friend)")
    print(f"  • Henry ↔ Bob (1 friend)")
    print(f"\n{YELLOW}Pending Friend Requests:{RESET}")
    print(f"  • Grace → Alice")
    print(f"  • Bob → Iris")
    print(f"  • Eve → Henry")
    print(f"  • Jack → Charlie")
    
    # print(f"\n{MAGENTA}Games Created:{RESET}")
    # for i, game in enumerate(games_data, 1):
    #     status_color = GREEN if game['status'] == 'IN_PROGRESS' else YELLOW
    #     players_str = ' vs '.join(game['players'])
    #     token_str = f" | Token: {BOLD}{game['token']}{RESET}" if game['token'] and game['status'] == 'PENDING' else ""
    #     print(f"  {i}. {status_color}{game['status']}{RESET} - {game['type']} - {players_str}{token_str}")
    #     if game['id']:
    #         print(f"     {DIM}Game ID: {game['id']}{RESET}")
    
    print(f"\n{BLUE}Tournaments Created:{RESET}")
    for i, tourney in enumerate(tournaments_data, 1):
        status_color = GREEN if tourney['status'] == 'IN_PROGRESS' else YELLOW
        joined_str = ', '.join(tourney['joined'])
        token_str = f" | Token: {BOLD}{tourney['token']}{RESET}" if tourney['token'] else ""
        print(f"  {i}. {status_color}{tourney['status']}{RESET} - {tourney['players']} players (Score: {tourney['scoreToWin']})")
        print(f"     Joined: {joined_str} ({len(tourney['joined'])}/{tourney['players']}){token_str}")
        if tourney['id']:
            print(f"     {DIM}Tournament ID: {tourney['id']}{RESET}")
    
    print(f"\n{CYAN}Status Legend:{RESET}")
    print(f"  {GREEN}IN_PROGRESS{RESET} - Game/Tournament is currently active")
    print(f"  {YELLOW}PENDING{RESET} - Game/Tournament is waiting to start")
    print(f"\n{DIM}Tips:")
    print(f"  • Use 'getgame' / 'gettourney' to view detailed information")
    print(f"  • Use 'joingame' / 'jointourney' to join with tokens")
    print(f"  • Use 'startgame' / 'starttourney' to start pending matches")
    print(f"  • Use 'tourneygames' to view all games in a tournament{RESET}")
    print()
    
    return users

# def display_game_info(game: dict) -> None:
#     """Display detailed game information."""
#     print(f"\n{BOLD}Game Information{RESET}")
#     print("-" * 80)
#     print(f"Game ID: {game.get('id', 'N/A')}")
#     print(f"Type: {game.get('type', 'N/A')}")
#     print(f"Status: {game.get('status', 'N/A')}")
#     print(f"Score to Win: {game.get('scoreToWin', 'N/A')}")
#     print(f"Token: {game.get('token', 'Not generated')}")
#     print(f"Created By: {game.get('createdBy', 'N/A')}")
#     print(f"Is Creator: {game.get('isCreator', False)}")
    
#     game_users = game.get('gameUsers', [])
#     if game_users:
#         print(f"\n{BOLD}Players:{RESET}")
#         for gu in game_users:
#             user = gu.get('user', {})
#             score = gu.get('score', 0)
#             is_winner = gu.get('isWinner', False)
#             winner_tag = f" {GREEN}[WINNER]{RESET}" if is_winner else ""
#             print(f"  • {user.get('displayName', 'Unknown')} - Score: {score}{winner_tag}")
    
#     print(f"\nCreated At: {game.get('createdAt', 'N/A')}")
#     print(f"Started At: {game.get('startedAt', 'N/A')}")
#     print(f"Completed At: {game.get('completedAt', 'N/A')}")
#     print()

def display_tournament_info(tournament: dict) -> None:
    """Display detailed tournament information."""
    print(f"\n{BOLD}Tournament Information{RESET}")
    print("-" * 80)
    print(f"Tournament ID: {tournament.get('id', 'N/A')}")
    print(f"Status: {tournament.get('status', 'N/A')}")
    print(f"Number of Players: {tournament.get('numberPlayers', 'N/A')}")
    print(f"Total Rounds: {tournament.get('totalRounds', 'N/A')}")
    print(f"Score to Win: {tournament.get('scoreToWin', 'N/A')}")
    print(f"Token: {tournament.get('token', 'Not generated')}")
    print(f"Created By: {tournament.get('createdBy', 'N/A')}")
    print(f"Is Creator: {tournament.get('isCreator', False)}")
    
    participants = tournament.get('participants', [])
    if participants:
        print(f"\n{BOLD}Participants ({len(participants)}):{RESET}")
        for p in participants:
            user = p.get('user', {})
            is_eliminated = p.get('isEliminated', False)
            status_tag = f" {RED}[ELIMINATED]{RESET}" if is_eliminated else f" {GREEN}[ACTIVE]{RESET}"
            avatar = user.get('avatarUrl', 'N/A')
            print(f"  • {user.get('displayName', 'Unknown')}{status_tag}")
            print(f"    User ID: {user.get('id', 'N/A')}")
    
    print(f"\nCreated At: {tournament.get('createdAt', 'N/A')}")
    print(f"Started At: {tournament.get('startedAt', 'N/A')}")
    print(f"Completed At: {tournament.get('completedAt', 'N/A')}")
    print()


def create_game_interactive(users: List[User]) -> None:
    """Interactive game creation."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to create game:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    print(f"\n{CYAN}Game Types:{RESET}")
    print("  [0] LOCAL")
    print("  [1] ONLINE")
    print("  [2] TOURNAMENT")
    
    game_type_idx = get_int_input("\nSelect game type:")
    game_types = ["LOCAL", "ONLINE", "TOURNAMENT"]
    
    if game_type_idx is None or not (0 <= game_type_idx < len(game_types)):
        print(f"{RED}✗{RESET} Invalid game type")
        return
    
    game_type = game_types[game_type_idx]
    
    score_input = input(f"Score to win (1-10, press Enter for default): ").strip()
    score_to_win = None
    if score_input.isdigit():
        score = int(score_input)
        if 1 <= score <= 10:
            score_to_win = score
        else:
            print(f"{RED}✗{RESET} Score must be between 1 and 10")
            return
    
    game = user.create_game(game_type, score_to_win)
    if game:
        display_game_info(game)

def join_game_interactive(users: List[User]) -> None:
    """Interactive game joining."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to join game:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    token = input(f"\nEnter game token: ").strip()
    if not token:
        print(f"{RED}✗{RESET} Token is required")
        return
    
    result = user.join_game(token)
    if result:
        print(f"\n{GREEN}✓{RESET} Successfully joined game!")
        print(f"Game ID: {result.get('gameId', 'N/A')}")

def start_game_interactive(users: List[User]) -> None:
    """Interactive game starting."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to start game:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    game_id = input(f"\nEnter game ID: ").strip()
    if not game_id:
        print(f"{RED}✗{RESET} Game ID is required")
        return
    
    game = user.start_game(game_id)
    if game:
        display_game_info(game)

def get_game_interactive(users: List[User]) -> None:
    """Interactive game info retrieval."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to get game info:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    game_id = input(f"\nEnter game ID: ").strip()
    if not game_id:
        print(f"{RED}✗{RESET} Game ID is required")
        return
    
    game = user.get_game(game_id)
    if game:
        display_game_info(game)

def generate_token_interactive(users: List[User]) -> None:
    """Interactive game token generation."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to generate token:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    game_id = input(f"\nEnter game ID: ").strip()
    if not game_id:
        print(f"{RED}✗{RESET} Game ID is required")
        return
    
    token = user.generate_game_token(game_id)
    if token:
        print(f"\n{BOLD}Share this token with other players:{RESET}")
        print(f"{CYAN}{BOLD}{token}{RESET}")

def create_tournament_interactive(users: List[User]) -> None:
    """Interactive tournament creation."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to create tournament:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    print(f"\n{CYAN}Tournament Players Options:{RESET}")
    print("  Common values: 4, 8, 16, 32")
    
    num_players_input = input(f"Number of players (press Enter for default 8): ").strip()
    number_players = 8
    if num_players_input.isdigit():
        num_players = int(num_players_input)
        if num_players > 0:
            number_players = num_players
        else:
            print(f"{RED}✗{RESET} Number of players must be positive")
            return
    
    score_input = input(f"Score to win (1-10, press Enter for default 10): ").strip()
    score_to_win = 10
    if score_input.isdigit():
        score = int(score_input)
        if 1 <= score <= 10:
            score_to_win = score
        else:
            print(f"{RED}✗{RESET} Score must be between 1 and 10")
            return
    
    tournament = user.create_tournament(number_players, score_to_win)
    if tournament:
        display_tournament_info(tournament)

def join_tournament_interactive(users: List[User]) -> None:
    """Interactive tournament joining."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to join tournament:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    token = input(f"\nEnter tournament token: ").strip()
    if not token:
        print(f"{RED}✗{RESET} Token is required")
        return
    
    result = user.join_tournament(token)
    if result:
        print(f"\n{GREEN}✓{RESET} Successfully joined tournament!")
        print(f"Tournament ID: {result.get('tournamentId', 'N/A')}")

def start_tournament_interactive(users: List[User]) -> None:
    """Interactive tournament starting."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to start tournament:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    tournament_id = input(f"\nEnter tournament ID: ").strip()
    if not tournament_id:
        print(f"{RED}✗{RESET} Tournament ID is required")
        return
    
    tournament = user.start_tournament(tournament_id)
    if tournament:
        display_tournament_info(tournament)

def get_tournament_interactive(users: List[User]) -> None:
    """Interactive tournament info retrieval."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to get tournament info:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    tournament_id = input(f"\nEnter tournament ID: ").strip()
    if not tournament_id:
        print(f"{RED}✗{RESET} Tournament ID is required")
        return
    
    tournament = user.get_tournament(tournament_id)
    if tournament:
        display_tournament_info(tournament)

def generate_tournament_token_interactive(users: List[User]) -> None:
    """Interactive tournament token generation."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to generate tournament token:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    tournament_id = input(f"\nEnter tournament ID: ").strip()
    if not tournament_id:
        print(f"{RED}✗{RESET} Tournament ID is required")
        return
    
    token = user.generate_tournament_token(tournament_id)
    if token:
        print(f"\n{BOLD}Share this token with other players:{RESET}")
        print(f"{CYAN}{BOLD}{token}{RESET}")

def get_tournament_games_interactive(users: List[User]) -> None:
    """Interactive tournament games retrieval."""
    if not users:
        print(f"{YELLOW}⚠{RESET} No users available")
        return
    
    display_users(users)
    idx = get_int_input("User index to get tournament games:")
    
    if idx is None or not (0 <= idx < len(users)):
        print(f"{RED}✗{RESET} Invalid user index")
        return
    
    user = users[idx]
    if not user.token:
        print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
        user.login()
    
    tournament_id = input(f"\nEnter tournament ID: ").strip()
    if not tournament_id:
        print(f"{RED}✗{RESET} Tournament ID is required")
        return
    
    games = user.get_tournament_games(tournament_id)
    if games:
        print(f"\n{BOLD}Tournament Games ({len(games)} total){RESET}")
        print("-" * 80)
        for game in games:
            status_color = GREEN if game.get('status') == 'IN_PROGRESS' else YELLOW if game.get('status') == 'PENDING' else CYAN
            print(f"\n{status_color}{game.get('status', 'N/A')}{RESET} - Round {game.get('roundNumber', 'N/A')}, Match {game.get('matchNumber', 'N/A')}")
            print(f"  Game ID: {game.get('id', 'N/A')}")
            print(f"  Type: {game.get('type', 'N/A')}")
            
            game_users = game.get('gameUsers', [])
            if game_users:
                print(f"  Players:")
                for gu in game_users:
                    user_data = gu.get('user', {})
                    score = gu.get('score', 0)
                    is_winner = gu.get('isWinner', False)
                    winner_tag = f" {GREEN}[WINNER]{RESET}" if is_winner else ""
                    online_status = f"{GREEN}●{RESET}" if user_data.get('isOnline') else f"{DIM}○{RESET}"
                    print(f"    {online_status} {user_data.get('displayName', 'Unknown')} - Score: {score}{winner_tag}")
        print()



def main():
    clear_terminal()
    print(ASCII_BANNER)
    users = fetch_existing_users()
    if users:
        print(f"{GREEN}✓{RESET} Loaded {len(users)} existing users")
    else:
        print(f"{YELLOW}⚠{RESET} No users found in database")

    while True:
        print(f"\n{DIM}[{GREEN}new{RESET}{DIM} | {GREEN}random{RESET}{DIM} | {GREEN}mock{RESET}{DIM} | {GREEN}manuallogin{RESET}{DIM} | {CYAN}login{RESET}{DIM} | {CYAN}refresh{RESET}{DIM}]")
        print(f"{DIM}[{CYAN}friend{RESET}{DIM} | {CYAN}accept{RESET}{DIM} | {CYAN}reject{RESET}{DIM} | {CYAN}delete{RESET}{DIM} | {CYAN}friends{RESET}{DIM}]")
        print(f"{DIM}[{MAGENTA}creategame{RESET}{DIM} | {MAGENTA}joingame{RESET}{DIM} | {MAGENTA}startgame{RESET}{DIM} | {MAGENTA}getgame{RESET}{DIM} | {MAGENTA}gentoken{RESET}{DIM}]")
        print(f"{DIM}[{BLUE}createtourney{RESET}{DIM} | {BLUE}jointourney{RESET}{DIM} | {BLUE}starttourney{RESET}{DIM} | {BLUE}gettourney{RESET}{DIM} | {BLUE}gentourneytoken{RESET}{DIM} | {BLUE}tourneygames{RESET}{DIM}]")
        print(f"{DIM}[{YELLOW}logout{RESET}{DIM} | {BLUE}display{RESET}{DIM} | {RED}clean{RESET}{DIM} | clear | exit]{RESET}")
        cmd = input(f"{CYAN}>{RESET} ").strip().lower()
        
        if cmd == "exit":
            print(f"\n{CYAN}Goodbye!{RESET}\n")
            break
            
        elif cmd == "new":
            users = create_manual_user(users)
            
        elif cmd == "random":
            n = get_int_input("How many random users to create?")
            if n is not None and n > 0:
                users = create_random_users(n, users)
            else:
                print(f"{RED}✗{RESET} Invalid number")
                
        elif cmd == "mock":
            users = create_mock_scenario(users)
        
        elif cmd == "manuallogin":
            users = login_manual(users)
                
        elif cmd == "login":
            login_all_users(users)
        
        elif cmd == "refresh":
            print(f"\n{CYAN}Refreshing user list from database...{RESET}")
            users = fetch_existing_users()
            
        elif cmd == "friend":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users available")
                continue
            display_users(users)
            src = get_int_input("Source user index:")
            tgt = get_int_input("Target user index:")
            
            if src is None or tgt is None:
                continue
            if not (0 <= src < len(users) and 0 <= tgt < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
            if src == tgt:
                print(f"{RED}✗{RESET} Cannot send friend request to yourself")
                continue
                
            if not users[src].token:
                print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
                users[src].login()
            
            users[src].send_friend_request(users[tgt].display_name)
            
        elif cmd == "accept":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users available")
                continue
            display_users(users)
            idx = get_int_input("User index to accept friend request:")
            
            if idx is None:
                continue
            if not (0 <= idx < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
            
            if not users[idx].token:
                print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
                users[idx].login()
            
            # Show pending requests
            pending_requests = users[idx].get_pending_requests()
            if not pending_requests:
                print(f"{YELLOW}⚠{RESET} No pending friend requests to accept")
                continue
            
            print(f"\n{CYAN}Pending Friend Requests:{RESET}")
            for i, req in enumerate(pending_requests):
                friend = req.get('friend', {})
                display = friend.get('displayName', 'Unknown')
                req_id = req.get('id', 'N/A')
                print(f"  [{i}] {display} (Request ID: {req_id})")
            
            req_idx = get_int_input("\nSelect request to accept:")
            if req_idx is None:
                continue
            if not (0 <= req_idx < len(pending_requests)):
                print(f"{RED}✗{RESET} Invalid request index")
                continue
            
            friendship_id = pending_requests[req_idx].get('id')
            if friendship_id:
                users[idx].accept_friend_request(friendship_id)
            else:
                print(f"{RED}✗{RESET} Could not find friendship ID")
            
        elif cmd == "reject":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users available")
                continue
            display_users(users)
            idx = get_int_input("User index to reject friend request:")
            
            if idx is None:
                continue
            if not (0 <= idx < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
            
            if not users[idx].token:
                print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
                users[idx].login()
            
            # Show pending requests
            pending_requests = users[idx].get_pending_requests()
            if not pending_requests:
                print(f"{YELLOW}⚠{RESET} No pending friend requests to reject")
                continue
            
            print(f"\n{CYAN}Pending Friend Requests:{RESET}")
            for i, req in enumerate(pending_requests):
                friend = req.get('friend', {})
                display = friend.get('displayName', 'Unknown')
                req_id = req.get('id', 'N/A')
                print(f"  [{i}] {display} (Request ID: {req_id})")
            
            req_idx = get_int_input("\nSelect request to reject:")
            if req_idx is None:
                continue
            if not (0 <= req_idx < len(pending_requests)):
                print(f"{RED}✗{RESET} Invalid request index")
                continue
            
            friendship_id = pending_requests[req_idx].get('id')
            if friendship_id:
                users[idx].reject_friend_request(friendship_id)
            else:
                print(f"{RED}✗{RESET} Could not find friendship ID")
            
        elif cmd == "delete":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users available")
                continue
            display_users(users)
            idx = get_int_input("User index to delete a friendship:")
            
            if idx is None:
                continue
            if not (0 <= idx < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
            
            if not users[idx].token:
                print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
                users[idx].login()
            
            # Show active friends with friendship IDs
            friends = users[idx].get_friends()
            if not friends:
                print(f"{YELLOW}⚠{RESET} No active friendships to delete")
                continue
            
            print(f"\n{GREEN}Active Friendships:{RESET}")
            for i, friend in enumerate(friends):
                display = friend.get('displayName', 'Unknown')
                user_id = friend.get('id', 'N/A')
                friendship_id = friend.get('friendshipId', 'N/A')
                print(f"  [{i}] {display} (User ID: {user_id}) - Friendship ID: {friendship_id}")
            
            friend_idx = get_int_input("\nSelect friendship to delete:")
            if friend_idx is None:
                continue
            if not (0 <= friend_idx < len(friends)):
                print(f"{RED}✗{RESET} Invalid friendship index")
                continue
            
            friendship_id = friends[friend_idx].get('friendshipId')
            friend_name = friends[friend_idx].get('displayName', 'Unknown')
            
            if friendship_id:
                confirm = input(f"Delete friendship with {friend_name}? (yes/no): ").strip().lower()
                if confirm == "yes":
                    users[idx].delete_friend(friendship_id)
                else:
                    print(f"{CYAN}Cancelled{RESET}")
            else:
                print(f"{RED}✗{RESET} Could not find friendship ID")
            
        elif cmd == "friends":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users available")
                continue
            display_users(users)
            idx = get_int_input("User index to view friends:")
            
            if idx is None:
                continue
            if not (0 <= idx < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
            
            if not users[idx].token:
                print(f"{YELLOW}⚠{RESET} User must be logged in. Logging in...")
                users[idx].login()
            
            display_user_friends(users[idx])
            
        elif cmd == "creategame":
            create_game_interactive(users)
            
        elif cmd == "joingame":
            join_game_interactive(users)
            
        elif cmd == "startgame":
            start_game_interactive(users)
            
        elif cmd == "getgame":
            get_game_interactive(users)
            
        elif cmd == "gentoken":
            generate_token_interactive(users)
            
        elif cmd == "createtourney":
            create_tournament_interactive(users)
            
        elif cmd == "jointourney":
            join_tournament_interactive(users)
            
        elif cmd == "starttourney":
            start_tournament_interactive(users)
            
        elif cmd == "gettourney":
            get_tournament_interactive(users)
            
        elif cmd == "gentourneytoken":
            generate_tournament_token_interactive(users)
            
        elif cmd == "tourneygames":
            get_tournament_games_interactive(users)
            
        elif cmd == "logout":
            if not users:
                print(f"{YELLOW}⚠{RESET} No users to logout")
                continue
            display_users(users)
            idx = get_int_input("User index to logout:")
            
            if idx is None:
                continue
            if not (0 <= idx < len(users)):
                print(f"{RED}✗{RESET} Invalid user index")
                continue
                
            users[idx].logout()
            
        elif cmd == "display":
            display_users(users)
            
        elif cmd == "clean":
            confirm = input(f"{RED}WARNING:{RESET} Delete ALL users? Type 'yes' to confirm: ").strip().lower()
            if confirm == "yes":
                if clean_database():
                    users.clear()
                    print(f"{GREEN}✓{RESET} Users cleared")
            else:
                print(f"{CYAN}Cancelled{RESET}")
                
        elif cmd == "clear":
            clear_terminal()
            print(ASCII_BANNER)
            
        else:
            print(f"{YELLOW}⚠{RESET} Unknown command")

if __name__ == "__main__":
    main()