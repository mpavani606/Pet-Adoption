Pet Adoption Portal — MERN Stack Build Documentation

## Current build status

This workspace now contains a runnable MERN MVP. Phases 1-5 are implemented: JWT authentication, the pet and adoption-request API, routed adopter flows, and shelter/admin management screens. Phase 6 includes automated auth/workflow tests, responsive states, error handling, and deployment templates.

### Run locally

1. Install MongoDB locally or use a MongoDB Atlas connection string.
2. Copy `backend/.env.example` to `backend/.env` and set `MONGO_URI` and `JWT_SECRET`.
3. Run `npm run dev` from the project root.
4. Open the Vite URL shown in the terminal, usually `http://localhost:5173`.

The frontend falls back to sample pets when the API is unavailable, so the visual experience can be explored before MongoDB is configured. Authentication and adoption requests require the API and database to be running.

### Useful commands

`npm run install:all` installs root, backend, and frontend dependencies.

`npm run build` creates a production build of the frontend.

`npm run dev` starts the Express API on port 5000 and the Vite client on port 5173.

`npm test --prefix backend` runs the Jest/Supertest suite against an in-memory MongoDB instance.

### Deployment

The backend can be deployed with the included `render.yaml`. Set `MONGO_URI`, `JWT_SECRET`, and `CLIENT_ORIGIN` in the hosting provider. Deploy the `frontend` directory to Vercel or Netlify and set `VITE_API_URL` to the deployed API URL. The included `frontend/vercel.json` preserves client-side routes on refresh.

In production, `CLIENT_ORIGIN` restricts backend CORS to the deployed frontend origin. Keep `.env` files out of source control; only the example files are committed.

A phase-wise plan for building a full-stack Pet Adoption Portal where shelters list pets and users submit adoption requests through an approval workflow.

Stack: MongoDB · Express · React · Node.js (MERN) + JWT Auth Scope: 17 REST API endpoints across 3 resources — User, Pet, AdoptionRequest

Overview of Phases
Phase	Focus	Deliverable
Phase 1	Planning & Project Setup	Repo structure, DB schema, environment config
Phase 2	Backend — Authentication	Register/login/JWT/me endpoint working
Phase 3	Backend — Pets & Adoption Requests	All 14 remaining API endpoints working
Phase 4	Frontend — Core UI	React app: browse, search, request, login/register
Phase 5	Frontend — Dashboards & Approval Workflow	Shelter dashboard, approve/reject flow
Phase 6	Testing, Polish & Deployment	Validation, error handling, hosting
Phase 1: Planning & Project Setup
Goal: Have a working skeleton project, database design, and environment ready before writing feature code.

1.1 Define data models
User: name, email, password (hashed), role (adopter | shelter | admin), phone, timestamps
Pet: name, type, breed, age, gender, description, photoUrl, status (available | pending | adopted), shelter (ref → User), timestamps
AdoptionRequest: pet (ref → Pet), requester (ref → User), message, status (pending | approved | rejected), decisionAt, decisionBy, timestamps
1.2 Plan the API surface
Group the 17 endpoints by resource so later phases map cleanly to them:

Auth (3): register, login, me
Pets (7): create, list, get one, update, delete, search, available
Adoption Requests (7): create, list, get one, update, delete, approve, mine
1.3 Project scaffolding
pet-adoption-portal/
├── backend/
│   ├── config/db.js
│   ├── models/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/auth.js
│   ├── utils/generateToken.js
│   ├── server.js
│   └── .env
└── frontend/
    ├── public/
    └── src/
        ├── api/
        ├── context/
        ├── components/
        └── pages/
1.4 Environment & tooling
Initialize backend with npm init, install express, mongoose, jsonwebtoken, bcryptjs, cors, dotenv
Initialize frontend with Create React App, install axios, react-router-dom
Set up MongoDB (local mongod, Docker container, or Atlas free tier)
Create .env for backend: PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN
Phase 1 checklist

 Repo structure created
 MongoDB connection string ready
 Backend dependencies installed
 Frontend dependencies installed
 .env file created and gitignored
Phase 2: Backend — Authentication
Goal: Users can register, log in, and access a protected profile route using JWTs.

2.1 Build the User model
Hash password with bcryptjs in a pre-save hook
Add an instance method to compare a plaintext password against the hash
2.2 JWT utilities
generateToken(userId) — signs a token with JWT_SECRET and an expiry
protect middleware — reads Authorization: Bearer <token>, verifies it, attaches req.user
authorize(...roles) middleware — restricts a route to specific roles (e.g. shelter, admin)
2.3 Endpoints to implement
Method	Endpoint	Notes
POST	/api/auth/register	Validate input, hash password, create user, return JWT
POST	/api/auth/login	Verify credentials, return JWT
GET	/api/auth/me	Protected — returns the logged-in user's profile
2.4 Manual testing
Use Postman/Insomnia/curl to register a user, log in, and call /me with the returned token
Confirm requests without a token (or an expired/invalid one) are rejected with 401
Phase 2 checklist

 Passwords stored hashed, never in plaintext
 Login returns a valid JWT
 /me correctly identifies the requesting user
 Invalid/missing token returns 401
Phase 3: Backend — Pets & Adoption Requests
Goal: All remaining 14 endpoints are implemented and connected to the User auth system from Phase 2.

3.1 Pet endpoints
Method	Endpoint	Access	Notes
POST	/api/pets	shelter/admin	Create a pet, tied to req.user._id as shelter
GET	/api/pets	Public	Paginated (?page=&limit=)
GET	/api/pets/:id	Public	404 if not found
PUT	/api/pets/:id	Owning shelter/admin	Ownership check before update
DELETE	/api/pets/:id	Owning shelter/admin	Ownership check before delete
GET	/api/pets/search?type=&age=	Public	Filter by type/age (and optionally age range)
GET	/api/pets/available	Public	status: 'available' only
Routing order matters: /search and /available must be registered before /:id, or Express will treat "search"/"available" as an :id value.

3.2 Adoption Request endpoints
Method	Endpoint	Access	Notes
POST	/api/requests	Authenticated	Block duplicate pending requests for the same pet; block requesting an unavailable pet
GET	/api/requests	shelter/admin	Paginated, optionally filterable by status
GET	/api/requests/:id	Owner/shelter/admin	Ownership/role check
PUT	/api/requests/:id	Owner/shelter/admin	Owner can edit message; shelter/admin can change status
DELETE	/api/requests/:id	Owner/admin	Cancel a request
PATCH	/api/requests/:id/approve	Owning shelter/admin	Sets request → approved, pet → adopted
GET	/api/requests/mine	Authenticated	Current user's own requests
3.3 The approval workflow (core feature)
This is the heart of the app — design it deliberately:

Adopter submits a request → status: pending
Shelter reviews requests for their pets (GET /api/requests filtered to their pets, or GET /api/requests/mine from the adopter's side)
Shelter calls PATCH /api/requests/:id/approve:
Request → approved, decisionAt/decisionBy set
Pet → adopted
Recommended: auto-reject any other pending requests for that same pet, since it's no longer available
Rejections go through PUT /api/requests/:id with { status: 'rejected' }
3.4 Error handling conventions
Decide these once and apply consistently across all controllers:

400 — bad/missing input
401 — no/invalid token
403 — authenticated but not authorized for this action
404 — resource not found
500 — unexpected server error
Phase 3 checklist

 All 14 endpoints implemented and manually tested
 Pagination works and returns total/totalPages
 Search filters correctly by type and age
 Only the owning shelter (or admin) can edit/delete/approve
 Approving a request updates both the request and the pet
 Duplicate/invalid adoption requests are rejected with clear messages
Phase 4: Frontend — Core UI
Goal: A logged-out or logged-in adopter can browse pets, search, register/login, and submit adoption requests.

4.1 App shell
AuthContext — holds current user, exposes login, register, logout; hydrates from a stored JWT on load
axios instance with a request interceptor that attaches Authorization: Bearer <token>
PrivateRoute wrapper for pages that require login (and optionally specific roles)
Navbar with conditional links based on auth state/role
4.2 Pages
Page	Route	Purpose
Pet List	/	Browse/search available pets
Pet Detail	/pets/:id	View one pet, submit adoption request
Login	/login	Auth
Register	/register	Auth, choose role (adopter/shelter)
My Requests	/my-requests	Adopter's own request history
4.3 Key interactions
Search form drives GET /api/pets/search?type=&age=; empty search falls back to GET /api/pets/available
"Request Adoption" button calls POST /api/requests with the pet id
Form validation on the client (required fields, min password length) as a first line of defense — the backend remains the source of truth
Phase 4 checklist

 User can register and log in from the UI
 Pet list loads and search/filter works
 Pet detail page shows full info and a working request button
 "My Requests" shows the logged-in user's requests with status
 Logged-out users are redirected away from protected pages
Phase 5: Frontend — Shelter Dashboard & Approval Workflow
Goal: Shelter/admin users can manage their pet listings and act on incoming adoption requests.

5.1 Pages
Page	Route	Purpose
Add/Edit Pet	/pets/new, /pets/:id/edit	Create or update a pet listing
Manage Requests	/requests	List incoming requests, approve/reject
5.2 Role-based UI
Only shelter/admin users see "Add Pet" and "Manage Requests" nav links
PrivateRoute should accept an optional roles prop and block/redirect otherwise
Pet Detail page shows "Edit"/"Delete" only to the owning shelter or an admin
5.3 Approval UI
Each request card shows requester info, pet, message, and status
"Approve" → PATCH /api/requests/:id/approve, then refresh the list
"Reject" → PUT /api/requests/:id with { status: 'rejected' }
Reflect the pet's new status (e.g. adopted) immediately after approval
Phase 5 checklist

 Shelter can create, edit, and delete their own pets from the UI
 Shelter cannot edit/delete another shelter's pets (enforced both client- and server-side)
 Manage Requests page lists pending requests with working Approve/Reject
 Pet status updates visibly after approval
Phase 6: Testing, Polish & Deployment
Goal: The app is reliable, presentable, and reachable outside localhost.

6.1 Testing
Manually walk through every endpoint with Postman/Insomnia (happy path + at least one failure case each)
Add basic backend tests (e.g. Jest + Supertest) for auth and the approval workflow, since that's the app's core logic
Cross-role checks: confirm an adopter cannot approve requests, cannot edit others' pets, etc.
6.2 Polish
Consistent error messages and loading/empty states on every page
Basic responsive layout (mobile-friendly pet grid, forms)
Input validation on both client and server (e.g. required fields, age ≥ 0, valid email)
Friendly 404 page and a global API error boundary in the frontend
6.3 Deployment
Database: MongoDB Atlas (free tier is enough for a portfolio project)
Backend: Render, Railway, or a small VM — set MONGO_URI, JWT_SECRET, PORT as environment variables
Frontend: Vercel or Netlify — set REACT_APP_API_URL to the deployed backend URL
Enable CORS on the backend for the deployed frontend's origin
Double-check .env is gitignored and secrets aren't committed
6.4 Nice-to-haves (optional, post-MVP)
Image upload (Cloudinary/S3) instead of a plain photoUrl field
Email notification on approval/rejection
Admin panel for managing all users/pets/requests
Refresh tokens / token expiry handling in the UI
Phase 6 checklist

 All endpoints tested for both success and failure cases
 Role permissions verified end-to-end
 App deployed and reachable via a public URL
 README updated with setup + live demo link
Quick Reference: Full Endpoint List by Phase
#	Method	Endpoint	Phase
1	POST	/api/auth/register	2
2	POST	/api/auth/login	2
3	GET	/api/auth/me	2
4	POST	/api/pets	3
5	GET	/api/pets	3
6	GET	/api/pets/:id	3
7	PUT	/api/pets/:id	3
8	DELETE	/api/pets/:id	3
9	GET	/api/pets/search	3
10	GET	/api/pets/available	3
11	POST	/api/requests	3
12	GET	/api/requests	3
13	GET	/api/requests/:id	3
14	PUT	/api/requests/:id	3
15	DELETE	/api/requests/:id	3
16	PATCH	/api/requests/:id/approve	3
17	GET	/api/requests/mine	3