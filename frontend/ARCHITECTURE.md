# Frontend Architecture Guide

## Overview

This document explains the purpose and interaction between `store.ts` and `UserService.ts` in our application architecture.

---

## 🏪 Store (`store.ts`)

### **Purpose**
The store is a **state management system** that holds the application's data in memory and notifies components when data changes.

### **What it does**
- ✅ Stores user data (id, email, name, accessToken, etc.)
- ✅ Allows components to **read** current state
- ✅ Allows components to **update** state
- ✅ Notifies subscribers when state changes (reactive updates)

### **What it does NOT do**
- ❌ Does NOT make API calls
- ❌ Does NOT contain business logic
- ❌ Does NOT validate data

### **Key Methods**
```typescript
get()              // Read current state
set(value)         // Replace entire state
update(fn)         // Update state with a function
subscribe(fn)      // Listen for state changes
```

---

## 🔧 UserService (`UserService.ts`)

### **Purpose**
The UserService is a **business logic layer** that orchestrates API calls and store updates.

### **What it does**
- ✅ Makes API calls (create user, login, logout, etc.)
- ✅ Updates the store with API responses
- ✅ Handles errors and validation
- ✅ Manages localStorage persistence
- ✅ Contains authentication logic

### **What it does NOT do**
- ❌ Does NOT directly render UI
- ❌ Does NOT hold state (delegates to store)

### **Key Methods**
```typescript
createUser()       // Create account + update store
loginUser()        // Login + save token to store
logoutUser()       // Logout + clear store
getUserState()     // Fetch user data + update store
updateUser()       // Update user + sync store
```

---

## 🔄 How They Work Together

### **Example Flow: Create Account → Login → Display Dashboard**

```
┌─────────────────┐
│  RegisterPopUp  │  (UI Component)
└────────┬────────┘
         │
         │ 1. User submits form
         ▼
┌─────────────────────┐
│   userService       │
│  .createUser()      │
└────────┬────────────┘
         │
         │ 2. Call API
         ▼
┌─────────────────────┐
│   userApi.create()  │  (HTTP Request)
└────────┬────────────┘
         │
         │ 3. Response: { id, email, name }
         ▼
┌─────────────────────┐
│   ctx.user.update() │  (Store Update)
│   Store now has:    │
│   - id: "123"       │
│   - email: "..."    │
│   - name: "..."     │
└────────┬────────────┘
         │
         │ 4. Save to localStorage
         ▼
┌─────────────────────┐
│  localStorage       │
│  .setItem()         │
└────────┬────────────┘
         │
         │ 5. Auto-login after registration
         ▼
┌─────────────────────┐
│   userService       │
│   .loginUser()      │
└────────┬────────────┘
         │
         │ 6. Call API
         ▼
┌─────────────────────┐
│   userApi.login()   │  (HTTP Request)
└────────┬────────────┘
         │
         │ 7. Response: { accessToken, id }
         ▼
┌─────────────────────┐
│   ctx.user.update() │  (Store Update)
│   Store now has:    │
│   - accessToken     │
│   - isLoggedIn: true│
└────────┬────────────┘
         │
         │ 8. Navigate to dashboard
         ▼
┌─────────────────────┐
│   Dashboard         │  (UI Component)
│   reads ctx.user    │
│   displays username │
└─────────────────────┘
```

---

## 📝 Real Code Example

### **1. User Clicks "Create Account"**

```typescript
// In RegisterPopUp.ts
const response = await userService.createUser({
    email: 'user@example.com',
    name: 'John',
    surname: 'Doe',
    password: 'password123',
    displayName: 'johndoe',
    avatarFile: null
}, ctx);
```

### **2. UserService Makes API Call + Updates Store**

```typescript
// In UserService.ts
async createUser(data: CreateUserDto, ctx: AppStores) {
    // 1. Call API
    const result = await userApi.create(data);
    
    // 2. Update store with response
    ctx.user.update((prevState) => ({
        ...prevState,
        id: result.id,
        email: result.email,
        name: result.name
    }));
    
    // 3. Save to localStorage
    this.saveToLocalStorage(ctx);
    
    return result;
}
```

### **3. Store Updates and Notifies**

```typescript
// In store.ts
update(updater: (prev: T) => T) {
    state = updater(state);  // Update state
    bus.dispatchEvent(new CustomEvent("change", { detail: state }));  // Notify
}
```

### **4. Auto-Login After Registration**

```typescript
// In RegisterPopUp.ts (after createUser succeeds)
const user = await userService.loginUser(email, password, ctx);
router.navigateTo('/home');  // Navigate to dashboard
```

### **5. Dashboard Reads User Data from Store**

```typescript
// In Dashboard.ts
export function Dashboard(ctx: AppStores): string {
    const user = ctx.user.get();  // Read from store
    
    return `
        <h1>Welcome, ${user?.displayName || 'User'}!</h1>
        <p>Email: ${user?.email}</p>
    `;
}
```

---

## 🎯 Key Differences

| Aspect | Store | UserService |
|--------|-------|-------------|
| **Purpose** | Hold data | Manage data flow |
| **Responsibility** | State management | Business logic |
| **Makes API calls?** | ❌ No | ✅ Yes |
| **Updates state?** | ✅ Yes (direct) | ✅ Yes (via store) |
| **Used by** | Services & Components | Components only |
| **Layer** | Data Layer | Service Layer |

---

## 📦 Architecture Layers

```
┌──────────────────────────────────┐
│       UI Components              │  (RegisterPopUp, Dashboard, NavBar)
│       Read/Display Data          │
└────────────┬─────────────────────┘
             │
             │ Call methods
             ▼
┌──────────────────────────────────┐
│       UserService                │  (Business Logic + Orchestration)
│       - API calls                │
│       - Store updates            │
│       - localStorage             │
└────────────┬─────────────────────┘
             │
             ├──────────────┬──────────────┐
             ▼              ▼              ▼
┌─────────────────┐  ┌─────────┐  ┌─────────────┐
│   userApi       │  │  Store  │  │ localStorage│
│   (HTTP Layer)  │  │ (State) │  │ (Persist)   │
└─────────────────┘  └─────────┘  └─────────────┘
```

---

## 💡 When to Use What

### **Use Store directly when:**
- Reading current user state in a component
- Subscribing to state changes for reactive UI

```typescript
const user = ctx.user.get();
ctx.user.subscribe((newUser) => {
    console.log('User changed:', newUser);
});
```

### **Use UserService when:**
- Creating/updating/deleting users
- Logging in/out
- Any operation that needs an API call

```typescript
await userService.loginUser(email, password, ctx);
await userService.updateUser({ name: 'New Name' }, ctx);
```

---

## 🔐 Why This Architecture?

1. **Separation of Concerns**: Each layer has a single responsibility
2. **Testability**: Can test business logic without UI
3. **Reusability**: Services can be used by any component
4. **Maintainability**: Changes to API don't affect UI directly
5. **Predictability**: Single source of truth (store) for all state

---

## 🚀 Summary

- **Store** = "Where is the data?"
- **UserService** = "How do I change the data?"
- **Components** = "How do I show the data?"

The flow is always: **Component → Service → API & Store → Component updates**
