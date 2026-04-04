# Authentication Implementation Plan

## Overview
Secure the backend API with NextAuth.js authentication. The current backend operates without any authentication, allowing anyone to access the `/api/generate-paper` endpoint and consume Gemini API credits.

---

## Current System Analysis

### Backend Stack
| Component | Technology |
|-----------|------------|
| Server | Express.js (port 8080) |
| Real-time | Socket.io |
| Job Queue | BullMQ |
| Cache/Queue Storage | Redis |
| Database | MongoDB via Mongoose |

### Frontend Stack
| Component | Technology |
|-----------|------------|
| Framework | Next.js 16.2 (App Router) |
| Styling | Tailwind CSS 4 |
| State | Zustand |
| Real-time Client | Socket.io-client |
| Auth | None (currently) |

### Vulnerable Endpoints
| Endpoint | Method | Risk |
|----------|--------|------|
| `/api/generate-paper` | POST | Triggers Gemini API (financial cost) |
| `/api/assignments` | GET | Exposes all user data |
| `/api/assignments/:id` | GET/PUT/DELETE | Full CRUD access without ownership |
| `/api/assignments/:id/regenerate` | POST | Additional Gemini API calls |

### Socket.io Vulnerability
- `joinJobRoom(jobId)` - Any client can join any room and receive generated papers from other users

---

## Implementation Plan

### Phase 1: Authentication Provider Setup (NextAuth.js)

**Objective:** Establish user sign-in on the frontend and generate verifiable JWT tokens.

#### 1.1 Install Dependencies
```bash
# Backend
npm install next-auth jose jsonwebtoken

# Frontend  
npm install next-auth
```

#### 1.2 Configure NextAuth.js

**File: `Frontend/app/api/auth/[...nextauth]/route.ts`**
- Create NextAuth route handler with `[...nextauth]` catch-all route
- Use CredentialsProvider for email/password authentication
- Configure JWT strategy with proper callbacks
- Set session to return user ID
- Generate secret key for token signing

**Environment Variables Required:**
```
# Frontend (.env.local)
NEXTAUTH_SECRET=your-256-bit-secret-key
NEXTAUTH_URL=http://localhost:3000

# Backend (.env)  
JWT_SECRET=same-secret-key-from-frontend
```

#### 1.3 Create User Model
**File: `Backend/src/models/User.ts`**
```typescript
{
  email: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}
```

---

### Phase 2: Auth Middleware (Express)

**Objective:** Verify JWT tokens on every API request before processing.

#### 2.1 Create Auth Middleware
**File: `Backend/src/middleware/authMiddleware.ts`**
- Extract `Authorization: Bearer <token>` header
- Verify JWT using jose library (JWT verification)
- Extract `userId` from token payload
- Attach user to `req.user` object
- Return 401 Unauthorized if invalid/missing token

#### 2.2 Apply Middleware to Routes
**File: `Backend/src/routes/api.ts`**
- Import auth middleware
- Apply to all routes except `/health` (public endpoint)
- All protected routes require valid token

#### 2.3 Update Request Handling
- Modify `/api/generate-paper` to store `userId` with assignment
- Update `/api/assignments` to filter by userId
- Track job ownership with userId in the assignment document

---

### Phase 3: Secure Socket.io Connections

**Objective:** Prevent unauthorized clients from receiving generated papers.

#### 3.1 Create Socket Auth Middleware
**File: `Backend/src/middleware/socketAuth.ts`**
- Verify token from `socket.handshake.auth.token`
- Attach userId to socket instance
- Reject invalid connections before room join
- Drop connection if token is invalid

#### 3.2 Update Socket Connection Handler
**File: `Backend/src/index.ts`**
- Apply auth middleware to Socket.io
- Modify `joinJobRoom` to verify user owns the job before allowing room join
- Store job-to-user mapping in Redis for verification

---

### Phase 4: Job Ownership & Validation

**Objective:** Ensure users can only access their own generated papers.

#### 4.1 Update Assignment Model
Add `userId` field to Assignment schema:
```typescript
userId: { type: String, required: true }
```

#### 4.2 Modify API Routes
- `/api/generate-paper`: Add userId to job payload and assignment document
- `/api/assignments`: Filter assignments by userId (show only user's own)
- `/api/assignments/:id`: Verify user owns assignment before returning data
- `/api/assignments/:id/regenerate`: Verify ownership before allowing regeneration
- `/api/assignments/:id`: Verify ownership before delete operations

#### 4.3 Socket Room Validation
- `joinJobRoom`: Verify requesting userId matches job's owner in database
- Reject if user tries to access another user's job room
- Emit error event if validation fails

---

### Phase 5: Rate Limiting

**Objective:** Limit excessive API calls from authenticated users.

#### 5.1 Install Dependencies
```bash
npm install express-rate-limit
```

#### 5.2 Configure Rate Limiter
**File: `Backend/src/middleware/rateLimiter.ts`**
- Window: 30 minutes (1800000 ms)
- Max requests: 10 per window per user
- Use in-memory store or Redis for distributed rate limiting
- Return 429 Too Many Requests when exceeded
- Include `Retry-After` header with appropriate time

#### 5.3 Apply Rate Limiter
- Apply to `/api/generate-paper` endpoint (most resource-intensive)
- Use userId from JWT as rate limit key (instead of IP)
- Include helpful error message with remaining time
- Optional: Also apply to `/api/assignments/:id/regenerate`

---

## File Changes Summary

### New Files to Create
| File | Purpose |
|------|---------|
| `Frontend/app/api/auth/[...nextauth]/route.ts` | NextAuth route handler with credentials provider |
| `Frontend/app/api/auth/signin/page.tsx` | Custom sign-in page UI |
| `Frontend/app/api/auth/signup/page.tsx` | Custom sign-up page UI |
| `Backend/src/middleware/authMiddleware.ts` | JWT verification middleware for Express |
| `Backend/src/middleware/socketAuth.ts` | JWT verification middleware for Socket.io |
| `Backend/src/middleware/rateLimiter.ts` | Rate limiting middleware |
| `Backend/src/models/User.ts` | User model for authentication |

### Files to Modify
| File | Changes |
|------|---------|
| `Backend/src/routes/api.ts` | Apply auth middleware, add userId filtering to assignments, verify ownership |
| `Backend/src/index.ts` | Apply socket auth middleware, update joinJobRoom logic |
| `Backend/src/workers/consumer.ts` | Include userId in job processing (for logging/auditing) |
| `Frontend/app/layout.tsx` | Add SessionProvider for NextAuth |
| `Frontend/app/assignments/create/page.tsx` | Send auth token with API requests |
| `Frontend/store/useStore.ts` | Add auth state (user, isAuthenticated) |
| `Frontend/components/layout/AppLayout.tsx` | Add auth-aware components (user menu, login button) |

### Environment Variables
```
# Frontend (.env.local)
NEXTAUTH_SECRET=<generate-256-bit-random-key>
NEXTAUTH_URL=http://localhost:3000

# Backend (.env)
JWT_SECRET=<same-key-as-nx-auth-secret>
RATE_LIMIT_WINDOW_MS=1800000  # 30 minutes
RATE_LIMIT_MAX_REQUESTS=10
```

---

## Implementation Order

1. **Phase 1**: Set up NextAuth.js on frontend
   - Install dependencies
   - Create auth route handler
   - Create custom sign-in/signup pages
   - Update layout with SessionProvider
   - Add auth state to store

2. **Phase 2**: Create auth middleware on backend
   - Install dependencies
   - Create auth middleware
   - Apply to API routes
   - Update routes to track userId

3. **Phase 3**: Secure Socket.io connections
   - Create socket auth middleware
   - Update index.ts to use middleware
   - Modify joinJobRoom to verify ownership

4. **Phase 4**: Add job ownership validation
   - Update Assignment model schema
   - Filter assignments by userId
   - Verify ownership on all operations

5. **Phase 5**: Apply rate limiting
   - Install express-rate-limit
   - Create rate limiter middleware
   - Apply to generate-paper endpoint

---

## Security Considerations

- **Token Expiry**: JWT tokens should expire after reasonable time (24 hours default in NextAuth)
- **Password Security**: If using credentials, store password hashes using bcrypt
- **HTTPS**: Ensure HTTPS is enabled in production
- **Logging**: Log authentication failures for security monitoring
- **Token Refresh**: Implement token refresh mechanism for long sessions
- **CORS**: Keep CORS restricted to known origins only

---

## Testing Checklist

- [ ] User can sign up with email/password
- [ ] User can sign in and receive session
- [ ] Unauthenticated requests return 401
- [ ] Users can only see their own assignments
- [ ] Users cannot access other users' assignments by ID
- [ ] Socket connections require valid token
- [ ] Users cannot join other users' job rooms
- [ ] Rate limiting blocks excessive requests (10 per 30 min)
- [ ] Regeneration only works for assignment owners
- [ ] Delete operations only work for assignment owners

---

## API Request Flow After Auth

### Frontend Request (with auth)
```javascript
// Get session token
const { data: session } = useSession();
const token = session?.accessToken;

// Include in requests
fetch('/api/generate-paper', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify(payload)
});
```

### Backend Verification Flow
```
Request → Auth Middleware → Verify JWT → Attach userId → Route Handler
                                                           ↓
                                                    Store userId with job
```

### Socket Connection Flow
```
Client Connect → Socket Auth Middleware → Verify Token → Attach userId
                                                              ↓
Client Joins Room → Verify userId owns job → Allow/Deny Room Join
```

---

## Migration Strategy

Since this is adding authentication to an existing system:

1. **Backward Compatibility**: Initially, make auth middleware optional to not break existing flow
2. **Gradual Rollout**: Enable auth on one endpoint at a time
3. **Data Migration**: Add userId to existing assignments (admin or migration script)
4. **Testing**: Thoroughly test each phase before proceeding to next

Optionally, implement a "migration mode" where existing assignments without userId are still accessible but new assignments require auth.