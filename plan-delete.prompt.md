## Plan: Realtime Online Status for Friends List

Add a small presence system on the existing Socket.IO connection so the Svelte main page can (1) request the current online/offline status for the user’s friends and (2) receive push updates when a friend comes online or goes offline. Keep it privacy-safe by only exposing presence to actual friends.

**Steps**
1. Backend: track online users in memory
   1. Update `FriendsGateway` to maintain an in-memory map of online users (e.g., `Map<number, Set<string>>` or `Map<number, number>`).
   2. In `handleConnection`, after JWT verify and `client.data.userId` is set, increment the user’s online count (or add `client.id` to set).
   3. In `handleDisconnect`, decrement/remove, and detect transitions `offline -> online` and `online -> offline`.

2. Backend: compute friend IDs without circular deps
   1. Inject `Repository<Friendship>` into `FriendsGateway` (via `@InjectRepository(Friendship)`), using existing `TypeOrmModule.forFeature([Friendship, User])` in `FriendsModule`.
   2. Add a helper in `FriendsGateway` to query accepted friendships for a given userId and return `friendIds`.

3. Backend: presence API over WebSockets
   1. Add `@SubscribeMessage('friends:getPresence')` in `FriendsGateway`.
   2. Handler flow:
      - Read requesterId from `client.data.userId`.
      - Query `friendIds` (accepted only).
      - If client provides `userIds`, intersect with `friendIds` to prevent leaking presence of arbitrary users.
      - Build a response as a map `{ [friendId]: boolean }` (or `{ onlineUserIds: number[] }`).
      - `client.emit('friends:presence', response)`.

4. Backend: push updates to friends
   1. On transition to online/offline for user X, query X’s `friendIds` and emit to each friend room:
      - event: `friends:presenceChanged`
      - payload: `{ userId: X, online: true|false }`
   2. Reuse existing room naming pattern `user:${userId}` already used by `FriendsGateway.emitToUser`.

5. Frontend (Svelte): request + render presence
   1. In `src/routes/+page.svelte`, add local state like `onlineById: Record<number, boolean>`.
   2. After `refreshFriendsAndRequests()` completes and `friendsSocket` exists, emit `friends:getPresence` with `{ userIds: friends.map(f => f.id) }`.
   3. Add socket listeners:
      - `friends:presence`: set `onlineById` from server response
      - `friends:presenceChanged`: update `onlineById[payload.userId] = payload.online`
   4. Update the friend list row to display online/offline (minimal UI: small label next to username).
   5. On logout / socket disconnect, clear `onlineById`.

**Relevant files**
- `srcs/requirements/nest/src/friends/friends.gateway.ts` — add presence tracking, `friends:getPresence`, and `friends:presenceChanged` broadcasts
- `srcs/requirements/nest/src/friends/friends.module.ts` — ensure `Friendship` is available for repo injection (already is); add any needed provider imports if introduced
- `srcs/requirements/svelte/src/routes/+page.svelte` — request presence and display online status in the friends list

**Verification**
1. Manual: open two browsers with different users
   - User A main page shows User B as Online when B has any page open that connects sockets (main page, game page, etc.).
   - Close B tab(s): A receives `friends:presenceChanged` and UI flips to Offline.
2. Manual: call `friends:getPresence` after refresh and confirm initial statuses match current connections.
3. Regression: match invites still work (MatchmakingGateway still uses the same socket).

**Decisions**
- Presence is “online if the user has at least one active Socket.IO connection”.
- Presence is only disclosed to accepted friends (server intersects requested IDs with friendship list).
- No “in match” indicator included in this slice (can be added later via GameService lookup or a game-status event).


## Plan Add-on: Reduce +page.svelte Size (Reuse, Not “New Garbage”)

Keep the UX exactly the same, but split code into reusable pieces so future asks don’t balloon the main page.

**Refactor goals**
- Reuse existing friend list (`friends: FriendUser[]`) and add presence via `onlineById` map (no new duplicated friend structures).
- Move repeated auth/localStorage access into a tiny shared helper.
- Move the large friends UI into a component, so `src/routes/+page.svelte` becomes a thin orchestrator.

**Steps**
1. Extract shared types
   - Create `srcs/requirements/svelte/src/lib/types.ts` exporting `FriendUser` and `FriendshipRequest` (and any other shared DTO-like types already duplicated in other Svelte files).
   - Update `src/routes/+page.svelte`, `src/lib/UserAvatar.svelte`, `src/lib/Ranking.svelte`, etc. to import those types instead of re-declaring.

2. Extract auth helpers (single source of truth)
   - Create `srcs/requirements/svelte/src/lib/auth.ts` with:
     - `getToken()`
     - `clearAuth()` (remove token/username/id if used)
     - `checkAuth()` (current `/auth/me` call) OR `isJwtExpired()` (local decode) — pick one and reuse everywhere.
   - Replace per-page `checkAuth()` copies with the shared one.

3. Extract friends panel UI into a component
   - Create `srcs/requirements/svelte/src/lib/FriendsPanel.svelte` that receives props:
     - `friends`, `onlineById`, `incomingRequests`, `outgoingRequests`, `incomingMatchInvites`, plus callbacks for invite/remove/accept/reject.
   - Move the markup/styles for the friends panel into that component (no UX changes).

4. Keep sockets + data loading in main page (minimal)
   - Keep only:
     - auth check
     - `FriendsAPI` initialization
     - socket initialization + event wiring (`friends:*`, `match:*`)
     - callouts to refresh data and presence
   - Everything else (rendering, button layout) lives in components.

**Verification**
- No behavioral/UX change: same buttons, same panels, same flows.
- Typecheck/build still passes.
- Presence still updates correctly after the component extraction.
