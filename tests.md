# UI Testing Checklist - ft_transcendence

## Table of Contents
1. [Authentication & User Management](#authentication--user-management)
2. [User Profile & Avatar](#user-profile--avatar)
3. [Friends & Social](#friends--social)
4. [Game - Basic Functionality](#game---basic-functionality)
5. [Game - Edge Cases](#game---edge-cases)
6. [Tournament - Basic Flow](#tournament---basic-flow)
7. [Tournament - Edge Cases](#tournament---edge-cases)
8. [Chat & Messaging](#chat--messaging)
9. [WebSocket & Real-Time](#websocket--real-time)
10. [Security & Permissions](#security--permissions)
11. [UI/UX & Navigation](#uiux--navigation)

---

## Authentication & User Management

### Registration
- [ ] Register with valid credentials (email, password, name, displayName)
- [ ] Try to register with an already existing email
- [ ] Try to register with an already existing displayName
- [ ] Register with empty required fields
- [ ] Register with invalid email format
- [ ] Register with weak password (if validation exists)
- [ ] Register with special characters in displayName
- [ ] Register with very long displayName (test max length)

### Login
- [ ] Login with correct credentials
- [ ] Login with wrong password
- [ ] Login with non-existent email
- [ ] Login with empty fields
- [ ] Check session persistence after login
- [ ] Check session expiration (wait for token to expire)
- [ ] Try accessing protected routes without login

### Google OAuth
- [ ] Login with Google account (first time)
- [ ] Login with Google account (existing user)
- [ ] Cancel Google OAuth flow mid-process
- [ ] Try Google OAuth with account that has no email

### Logout
- [ ] Logout and verify session is destroyed
- [ ] Try accessing protected routes after logout
- [ ] Check if user status changes to offline after logout

---

## User Profile & Avatar

### Avatar Upload
- [ ] Upload valid image (JPG)
- [ ] Upload valid image (PNG)
- [ ] Upload valid image (GIF)
- [ ] **Upload PDF file (should fail)**
- [ ] **Upload TXT file (should fail)**
- [ ] **Upload video file (MP4) (should fail)**
- [ ] Upload image larger than max size limit
- [ ] Upload very small image (1x1 pixel)
- [ ] Upload image with very long filename
- [ ] Upload image with special characters in filename
- [ ] Upload corrupt/broken image file
- [ ] Remove avatar (set back to default)
- [ ] Change avatar multiple times in quick succession

### Profile Update
- [ ] Update displayName to a new unique name
- [ ] Try to update displayName to an existing user's name
- [ ] Update displayName with special characters
- [ ] Update displayName to empty string
- [ ] Update name and surname
- [ ] Update with XSS attempt in fields (e.g., `<script>alert('xss')</script>`)
- [ ] Check if profile changes reflect in real-time to other users

---

## Friends & Social

### Friend Requests
- [ ] Send friend request to another user
- [ ] Send friend request to user who already received one from you
- [ ] Send friend request to someone who already sent you one
- [ ] Accept friend request
- [ ] Decline/reject friend request
- [ ] Try to send friend request to yourself
- [ ] Send multiple friend requests rapidly (spam test)
- [ ] Check friend request notifications

### Friends List
- [ ] View friends list
- [ ] Remove a friend
- [ ] Check online/offline status of friends
- [ ] Check lastSeenAt timestamp for offline friends
- [ ] Filter/search friends list (if feature exists)

### Block System
- [ ] Block a user
- [ ] Try to send message to blocked user
- [ ] Try to send friend request to blocked user
- [ ] Blocked user tries to send you message
- [ ] Blocked user tries to send you friend request
- [ ] Unblock a user
- [ ] Block and unblock same user multiple times
- [ ] Try to block yourself

---

## Game - Basic Functionality

### Game Creation
- [ ] Create local game (1v1 on same browser)
- [ ] Create online game
- [ ] Create online game with custom score to win (5, 10, 15)
- [ ] Create game and receive unique game token
- [ ] Share game token and have another player join
- [ ] Try to join game with invalid token

### Game Lobby
- [ ] Both players mark ready
- [ ] One player marks ready, other doesn't
- [ ] Player marks ready then unmarks
- [ ] Game starts when both players ready
- [ ] Player leaves lobby before game starts
- [ ] Check countdown/timer before game starts (if exists)

### Gameplay
- [ ] Control paddle with keyboard (W/S or Arrow keys)
- [ ] Ball moves and bounces correctly
- [ ] Score increments when ball passes paddle
- [ ] Game ends when score reaches scoreToWin
- [ ] Winner is correctly determined
- [ ] Game stats are saved to database
- [ ] Paddle collision detection works correctly
- [ ] Ball speed increases over time (if feature exists)
- [ ] Sound effects play correctly (if implemented)

---

## Game - Edge Cases

### Connection Issues
- [ ] Player disconnects mid-game
- [ ] Player reconnects after disconnect
- [ ] Both players disconnect simultaneously
- [ ] Internet lag/latency during gameplay
- [ ] Player closes browser tab during game
- [ ] Player refreshes page during game

### Abandonment
- [ ] Player abandons game (leaves without finishing)
- [ ] Check if game status changes to ABANDONED
- [ ] Check if other player gets notification
- [ ] Check if abandoned game affects player stats

### Multiple Games
- [ ] Try to join multiple games simultaneously
- [ ] Create game while already in another game
- [ ] Finish game and immediately start another

### Invalid States
- [ ] Try to join completed game
- [ ] Try to join game that's already full
- [ ] Try to access game with another user's ID
- [ ] Send game moves without being ready
- [ ] Send invalid paddle positions

---

## Tournament - Basic Flow

### Tournament Creation
- [ ] Create tournament with 4 players
- [ ] Create tournament with 8 players
- [ ] Create tournament with custom scoreToWin
- [ ] Tournament token is generated
- [ ] Share token with other players

### Tournament Registration
- [ ] Creator joins their tournament
- [ ] Other players join with valid token
- [ ] Try to join with invalid token
- [ ] Try to join tournament that's already full
- [ ] Try to join tournament that already started
- [ ] Check participant list updates in real-time

### Tournament Start
- [ ] All players mark ready
- [ ] Tournament starts when all ready
- [ ] Bracket/matchups are generated correctly
- [ ] First round matches are created
- [ ] Players are matched correctly

### Tournament Progression
- [ ] Complete first round match
- [ ] Winner advances to next round
- [ ] Loser is eliminated
- [ ] Second round matches are created automatically
- [ ] Continue until finals
- [ ] Finals match completes
- [ ] Winner is crowned
- [ ] Tournament status changes to COMPLETED

---

## Tournament - Edge Cases

### **Player Abandonment (Critical Test)**
- [ ] **One player quits during registration phase**
- [ ] **One player quits during first round match**
- [ ] **One player quits during semifinals**
- [ ] **One player quits during finals**
- [ ] **Check if quitting player is marked as eliminated**
- [ ] **Check if match continues or opponent auto-advances**
- [ ] **Check if tournament can continue with odd number of players**
- [ ] **Multiple players quit simultaneously**

### Disconnection Issues
- [ ] Player disconnects during tournament match
- [ ] Player doesn't reconnect within timeout
- [ ] Player reconnects and resumes
- [ ] Creator disconnects during tournament
- [ ] All players disconnect

### Invalid Actions
- [ ] Try to join same tournament twice
- [ ] Try to start tournament without enough players
- [ ] Try to manipulate bracket (if possible)
- [ ] Try to access tournament matches you're not in
- [ ] Cancel tournament mid-way (if feature exists)

### Edge Scenarios
- [ ] Create tournament but no one joins (timeout)
- [ ] Player leaves during countdown before match
- [ ] Two matches in same round finish at different times
- [ ] Check elimination round tracking (eliminatedInRound)
- [ ] Check final positions are assigned correctly

---

## Chat & Messaging

### Direct Messages
- [ ] Send message to friend
- [ ] Receive message from friend
- [ ] Send message with emojis
- [ ] Send very long message
- [ ] Send empty message (should fail)
- [ ] Send message with XSS attempt
- [ ] Send message with SQL injection attempt
- [ ] Send messages rapidly (spam test)
- [ ] Try to send message to non-friend
- [ ] Try to send message to blocked user

### Live Chat Status
- [ ] Check if lastLiveChatOnlineAt updates correctly
- [ ] See when friend was last online in chat
- [ ] Check typing indicator (if implemented)
- [ ] Check message read receipts (if implemented)

### Notifications
- [ ] Receive notification for new message
- [ ] Receive notification for friend request
- [ ] Receive notification for game invite (if implemented)
- [ ] Receive notification for tournament start
- [ ] Mark notification as read
- [ ] Delete notification
- [ ] Check notification count badge

### Game-Related Messages
- [ ] Messages related to game invites
- [ ] Messages related to tournament invites
- [ ] Check if gameId relation works correctly

---

## WebSocket & Real-Time

### Connection Stability
- [ ] WebSocket connects successfully for game
- [ ] WebSocket connects successfully for chat
- [ ] WebSocket reconnects after temporary disconnect
- [ ] Multiple tabs with same user (check if allowed)
- [ ] WebSocket stays alive during long game session

### Real-Time Updates
- [ ] Paddle position updates in real-time
- [ ] Ball position updates in real-time
- [ ] Score updates in real-time
- [ ] Friend online status updates in real-time
- [ ] New message appears without refresh
- [ ] Tournament bracket updates without refresh

### Error Handling
- [ ] Backend restarts during active game
- [ ] Database becomes unavailable
- [ ] WebSocket message parsing errors
- [ ] Invalid WebSocket payloads

---

## Security & Permissions

### Authorization
- [ ] Try to access another user's profile edit page
- [ ] Try to modify another user's data via API
- [ ] Try to delete another user's game
- [ ] Try to kick player from tournament you didn't create
- [ ] Try to access admin features (if any) as regular user

### CSRF & XSS
- [ ] Test CSRF token validation (if implemented)
- [ ] Try XSS in displayName field
- [ ] Try XSS in chat messages
- [ ] Try XSS in avatar filename
- [ ] Try script injection in URL parameters

### Rate Limiting
- [ ] Send many friend requests rapidly
- [ ] Send many messages rapidly
- [ ] Create many games rapidly
- [ ] Make many API calls in short time
- [ ] Check if rate limiting blocks abuse

---

## UI/UX & Navigation

### Routing
- [ ] Navigate to all main pages (home, profile, game, etc.)
- [ ] Use browser back/forward buttons
- [ ] Direct URL access to protected routes
- [ ] Direct URL access to non-existent routes (404)
- [ ] Refresh page while logged in
- [ ] Refresh page on game page
- [ ] Refresh page on tournament page

### Responsive Design
- [ ] Test on mobile screen size
- [ ] Test on tablet screen sizegi
- [ ] Test on desktop screen size
- [ ] Test on very large screen (4K)
- [ ] Rotate device (mobile/tablet)
- [ ] Zoom in/out on browser

### Browser Compatibility
- [ ] Test on Chrome
- [ ] Test on Firefox
- [ ] Test on Safari
- [ ] Test on Edge
- [ ] Test on mobile browsers (iOS Safari, Chrome Mobile)

### Loading States
- [ ] Check loading indicators during API calls
- [ ] Check loading state for image uploads
- [ ] Check loading state during game creation
- [ ] Check skeleton screens or placeholders

### Error Messages
- [ ] Verify error messages are user-friendly
- [ ] Verify error messages don't expose sensitive info
- [ ] Check if errors clear after successful action
- [ ] Check if form validation errors are clear

### Performance
- [ ] Load time for main pages
- [ ] Game frame rate (should be smooth)
- [ ] Large friends list performance
- [ ] Large message history performance
- [ ] Multiple simultaneous WebSocket connections

---

## Critical Bug Hunt Scenarios

These are high-priority test scenarios that often reveal serious bugs:

1. **The Quitter**: Create 4-player tournament, have player quit in round 1 match
2. **The PDF Avatar**: Try uploading PDF as profile picture
3. **The Double Login**: Login on two browsers simultaneously with same account
4. **The Ghost Player**: Disconnect mid-game and see if you become a "ghost"
5. **The Spam King**: Send 100 messages in 1 second
6. **The SQL Injector**: Try `'; DROP TABLE users; --` in all input fields
7. **The XSS Master**: Try `<script>alert(document.cookie)</script>` everywhere
8. **The Time Traveler**: Change system time during active session
9. **The Token Thief**: Copy session token and use in different browser
10. **The Race Condition**: Two players try to join as 4th player simultaneously
11. **The Infinite Score**: Modify score value in browser dev tools
12. **The Bracket Breaker**: All semifinals players quit at once
13. **The Chat Flooder**: Send 1MB message
14. **The Avatar Bomber**: Upload 100MB image file
15. **The Friend Spammer**: Send same friend request 50 times
16. **The Disconnect Dancer**: Connect/disconnect/connect rapidly
17. **The URL Hacker**: Modify game/tournament IDs in URL
18. **The Future Player**: Try to join game that hasn't been created yet
19. **The Past Ghost**: Try to rejoin game from 3 days ago
20. **The Self Destroyer**: Try to send friend request to yourself, block yourself

---

## Test Coverage Summary

- **Total Test Cases**: 200+
- **Priority Areas**: 
  - Tournament abandonment scenarios
  - File upload validation (PDF/non-image files)
  - WebSocket connection stability
  - XSS/SQL injection attempts
  - Real-time synchronization

## Testing Strategy

1. **Manual Testing**: Go through each section systematically
2. **Exploratory Testing**: Try unexpected user behaviors
3. **Stress Testing**: Multiple users, rapid actions, large data
4. **Security Testing**: Focus on injection, authorization, validation
5. **Cross-Browser Testing**: Ensure compatibility
6. **Mobile Testing**: Touch interactions, responsive design

## Reporting Bugs

When you find a bug, document:
- **Steps to reproduce**
- **Expected behavior**
- **Actual behavior**
- **Browser/device**
- **Screenshots/videos**
- **Console errors**
- **Network requests** (check browser DevTools)

---

**Good luck with testing! 🎮**