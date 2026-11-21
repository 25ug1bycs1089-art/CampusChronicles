# Campus Chronicles 🎓📰

**Campus Chronicles** is a campus-exclusive blog publishing platform where college students can write, review, and read articles across technology, academics, campus life, career opportunities, events, and personal experiences.

All published content goes through an editorial workflow to ensure high-quality, campus-relevant posts.

---

## 👥 User Roles & Workflow

1. **Student**
   - Write articles and save drafts.
   - Submit drafts for editorial review.
   - Edit their own drafts and submissions.
   - Comment on published articles.

2. **Editor**
   - Review pending articles in the editorial queue.
   - Approve articles for public release or reject them with constructive feedback.
   - Moderate user comments.

3. **Admin**
   - Manage users and promote roles (Student ➔ Editor ➔ Admin).
   - Create and organize article categories/tags.
   - Platform-wide oversight and moderation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, Vite, Tailwind CSS v4, React Router, Axios, Lucide React icons, Tiptap (Phase 4) |
| **Backend** | Node.js, Express.js 5, CORS, Dotenv, Nodemon |
| **Database** | MongoDB Atlas with Mongoose (Phase 2) |
| **Authentication** | JWT (JSON Web Tokens) with bcrypt password hashing (Phase 2) |
| **Storage & Deployment** | Cloudinary (media), Vercel (frontend), Render (backend) |

---

## 📁 Project Structure

```text
CampusChronicles/
├── client/                     # Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js       # Pre-configured Axios instance with VITE_API_URL
│   │   ├── assets/
│   │   ├── App.jsx             # Live verification & dashboard preview
│   │   ├── index.css           # Tailwind CSS directives
│   │   └── main.jsx            # React root entry point
│   ├── .env.example            # Frontend environment variable blueprint
│   ├── .env                    # Local frontend environment variables (git-ignored)
│   ├── package.json
│   └── vite.config.js
├── server/                     # Backend (Node.js + Express)
│   ├── src/
│   │   ├── app.js              # Express app setup, CORS, and route handlers
│   │   └── server.js           # Server bootstrap and port listener
│   ├── .env.example            # Backend environment variable blueprint
│   ├── .env                    # Local backend environment variables (git-ignored)
│   └── package.json
├── .gitignore                  # Global repository gitignore (ignoring node_modules & secrets)
└── README.md                   # Project documentation & setup instructions
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher (Node 24 LTS recommended)
- **npm**: v9.0.0 or higher
- **Git**

---

### 1. Backend Setup

1. Open your terminal and navigate to the backend directory:
   ```bash
   cd server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your local environment file:
   - Duplicate `.env.example` and name the copy `.env`:
     ```bash
     cp .env.example .env
     ```
   - In development, the default values in `.env` are ready for Phase 1:
     ```env
     PORT=5000
     NODE_ENV=development
     MONGODB_URI=
     JWT_SECRET=development_jwt_secret_placeholder
     CLIENT_URL=http://localhost:5173
     CLOUDINARY_URL=
     ```

4. Start the backend development server:
   ```bash
   npm run dev
   ```
   The backend will start on **`http://localhost:5000`**.

5. Verify the health check in your browser or terminal:
   ```bash
   curl http://localhost:5000/api/health
   ```
   Expected response:
   ```json
   {
     "status": "ok",
     "message": "Campus Chronicles API is operational",
     "timestamp": "...",
     "environment": "development"
   }
   ```

---

### 2. Frontend Setup

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd client
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your local environment file:
   - Duplicate `.env.example` and name the copy `.env`:
     ```bash
     cp .env.example .env
     ```
   - Ensure it points to your Express backend:
     ```env
     VITE_API_URL=http://localhost:5000/api
     ```

4. Start the frontend development server:
   ```bash
   npm run dev
   ```
   The frontend will be available at **`http://localhost:5173`**.

5. Open your browser at `http://localhost:5173`. You will see the **Campus Chronicles** welcome dashboard showing a green **"Backend Connected Successfully"** badge verifying live communication.

---

## 🔐 Environment Variables Guide

| Variable | Location | Description |
| :--- | :--- | :--- |
| `PORT` | `server/.env` | Port on which Express server listens (default: `5000`) |
| `NODE_ENV` | `server/.env` | Runtime environment (`development` or `production`) |
| `MONGODB_URI` | `server/.env` | MongoDB Atlas connection string *(configured in Phase 2)* |
| `JWT_SECRET` | `server/.env` | Secret key used to sign and verify JWT authentication tokens *(Phase 2)* |
| `CLIENT_URL` | `server/.env` | URL of the frontend for CORS authorization (`http://localhost:5173`) |
| `CLOUDINARY_URL` | `server/.env` | Cloudinary media storage URL (`cloudinary://key:secret@cloud_name`). Single variable replaces the deprecated `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` trio. Never expose to frontend. *(Phase 4)* |
| `VITE_API_URL` | `client/.env` | Base URL used by Axios to query backend endpoints |

> **Security Rule:** Never commit real secrets or `.env` files to Git. Both `.env` files are excluded by the root `.gitignore`.

---

## 🍃 MongoDB Atlas Configuration (Coming in Phase 2)

When we begin **Phase 2 (Database & Authentication)**, you will connect your database by:
1. Creating a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Creating a database user with read/write credentials.
3. Whitelisting your IP address (or `0.0.0.0/0` during development).
4. Copying the connection URI:
   ```text
   mongodb+srv://<username>:<password>@cluster0.mongodb.net/campus_chronicles?retryWrites=true&w=majority
   ```
5. Pasting it into `server/.env` as `MONGODB_URI`.

---

## 🗺️ Project Development Roadmap

- [x] **Phase 1: Project Initialization** (Repository, Express server, Vite React frontend, Tailwind CSS, Health check, Axios connection)
- [ ] **Phase 2: Database Connection & User Authentication** (MongoDB Atlas, User Schema, JWT auth, Role-based access control)
- [ ] **Phase 3: Category Management & Editorial Workflow Setup** (Categories, Article models, Status states: Draft/Pending/Approved/Rejected)
- [ ] **Phase 4: Article Creation & Rich-Text Editing** (Tiptap integration, Cloudinary image upload)
- [ ] **Phase 5: Editorial Review Dashboard & Moderation** (Editor approval/rejection interface, feedback notes)
- [ ] **Phase 6: Public Blog Views & Reader Experience** (Home feed, Category filters, Search, Reading view, Comments)
- [ ] **Phase 7: Admin Panel & User Role Management** (User directory, promote/demote roles, analytics)
- [ ] **Phase 8: Deployment & Production Hardening** (Vercel + Render + MongoDB Atlas production configuration)
