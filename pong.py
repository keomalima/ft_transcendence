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

ASCII_BANNER = f"""
{CYAN}{BOLD}
 ____  ____   __   __ _  ____   ___  ____  __ _  ____  ____  __ _   ___  ____ 
(_  _)(  _ \ / _\ (  ( \/ ___) / __)(  __)(  ( \(    \(  __)(  ( \ / __)(  __)
  )(   )   //    \/    /\___ \( (__  ) _) /    / ) D ( ) _) /    /( (__  ) _) 
 (__) (__\_)\_/\_/\_)__)(____/ \___)(____)\_)__)(____/(____)\_)__) \___)(____)
 
{RESET}
"""

BASE_URL = "http://localhost:3000/api/users"
FRIENDS_URL = "http://localhost:3000/api/friends"

class User:
    def __init__(self, email: str, password: str, name: str, surname: str, 
                 display_name: str, user_id: Optional[int] = None, 
                 token: Optional[str] = None):
        self.email = email
        self.password = password
        self.name = name
        self.surname = surname
        self.display_name = display_name
        self.token = token
        self.user_id = user_id

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
            resp = requests.post(f"{BASE_URL}/", json=data, timeout=5)
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
        """Login user. Returns True if successful."""
        data = {"email": self.email, "password": self.password}
        try:
            resp = requests.post(f"{BASE_URL}/login", json=data, timeout=5)
            if resp.status_code in (200, 201):
                json_data = resp.json()
                self.token = json_data.get("accessToken") or json_data.get("token")
                self.user_id = json_data.get("id") or json_data.get("user", {}).get("id")
                print(f"{GREEN}✓{RESET} Logged in {self.email}")
                return True
            else:
                print(f"{RED}✗{RESET} Failed to login {self.email}: {resp.text}")
                return False
        except requests.exceptions.RequestException as e:
            print(f"{RED}✗{RESET} Network error during login: {e}")
            return False

    def logout(self) -> bool:
        """Logout user. Returns True if successful."""
        if not self.token:
            print(f"{YELLOW}⚠{RESET} User {self.email} is not logged in")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.post(f"{BASE_URL}/logout", headers=headers, timeout=5)
            if resp.status_code == 200:
                print(f"{GREEN}✓{RESET} Logged out {self.email}")
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
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        data = {"addresseeDisplayName": target_display_name}
        try:
            resp = requests.post(FRIENDS_URL, json=data, headers=headers, timeout=5)
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
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.put(f"{FRIENDS_URL}/accept/{friendship_id}", headers=headers, timeout=5)
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
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.put(f"{FRIENDS_URL}/reject/{friendship_id}", headers=headers, timeout=5)
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
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return False
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.delete(f"{FRIENDS_URL}/{friendship_id}", headers=headers, timeout=5)
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
        """Get user's active friends list. Returns list of friends if successful."""
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return None
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.get(FRIENDS_URL, headers=headers, timeout=5)
            if resp.status_code == 200:
                return resp.json()
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
        if not self.token:
            print(f"{RED}✗{RESET} User {self.email} is not logged in")
            return None
        
        headers = {"Authorization": f"Bearer {self.token}"}
        try:
            resp = requests.get(f"{FRIENDS_URL}/requests", headers=headers, timeout=5)
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
                    user_id=u.get("id")
                )
                users.append(user)
            print(f"{CYAN}✓{RESET} Fetched {len(users)} existing users from the database")
        else:
            print(f"{RED}✗{RESET} Failed to fetch users: {resp.status_code}")
        return users
    except requests.exceptions.RequestException as e:
        print(f"{RED}✗{RESET} Network error while fetching users: {e}")
        return []

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
    print("-" * 60)
    
    # Display active friends
    if friends:
        print(f"\n{GREEN}Active Friends:{RESET}")
        for friend in friends:
            display = friend.get('displayName', 'Unknown')
            user_id = friend.get('id', 'N/A')
            friendship_id = friend.get('friendshipId', 'N/A')
            print(f"  • {display} (User ID: {user_id}) - Friendship ID: {friendship_id}")
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
    
    print()

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
    
    # Display summary
    print(f"{CYAN}{BOLD}Mock Scenario Summary:{RESET}")
    print(f"{GREEN}Active Friendships:{RESET}")
    print(f"  • Alice ↔ Bob, Charlie, Diana, Frank (4 friends)")
    print(f"  • Bob ↔ Alice, Eve, Henry (3 friends)")
    print(f"  • Charlie ↔ Alice, Diana (2 friends)")
    print(f"  • Diana ↔ Alice, Charlie, Frank (3 friends)")
    print(f"  • Eve ↔ Bob, Frank (2 friends)")
    print(f"  • Frank ↔ Alice, Diana, Eve, Grace (4 friends)")
    print(f"  • Grace ↔ Frank (1 friend)")
    print(f"  • Henry ↔ Bob (1 friend)")
    print(f"\n{YELLOW}Pending Requests:{RESET}")
    print(f"  • Grace → Alice")
    print(f"  • Bob → Iris")
    print(f"  • Eve → Henry")
    print(f"  • Jack → Charlie")
    print()
    
    return users

def main():
    clear_terminal()
    print(ASCII_BANNER)
    users = fetch_existing_users()
    if users:
        print(f"{GREEN}✓{RESET} Loaded {len(users)} existing users")
    else:
        print(f"{YELLOW}⚠{RESET} No users found in database")

    while True:
        print(f"\n{DIM}[{GREEN}new{RESET}{DIM} | {GREEN}random{RESET}{DIM} | {GREEN}mock{RESET}{DIM} | {CYAN}login{RESET}{DIM} | {CYAN}friend{RESET}{DIM} | {CYAN}accept{RESET}{DIM} | {CYAN}reject{RESET}{DIM} | {CYAN}delete{RESET}{DIM} | {CYAN}friends{RESET}{DIM} | {YELLOW}logout{RESET}{DIM} | {BLUE}display{RESET}{DIM} | {RED}clean{RESET}{DIM} | clear | exit]{RESET}")
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
                
        elif cmd == "login":
            login_all_users(users)
            
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