# Incidencias IT - HelpDesk System

Sistema de gestión de incidencias de TI desarrollado como proyecto Capstone. Migrado de JavaScript vanilla a una arquitectura moderna full-stack con React y Node.js.

## 📋 Descripción

HelpDesk IT es un sistema para reportar y gestionar incidencias tecnológicas. Permite a los usuarios crear tickets, asignarlos a técnicos, y hacer seguimiento del estado de las incidencias.

### Características principales

- ✅ Autenticación JWT con roles (admin, técnico, visor)
- ✅ Creación y gestión de incidencias
- ✅ Filtros y paginación de incidencias
- ✅ Actualización de estado (Nueva → Asignada → En Progreso → Resuelta → Cerrada)
- ✅ Notificaciones SMS vía Twilio (opcional)
- ✅ Interfaz responsive con Bootstrap 5
- ✅ Arquitectura Flux con Context API

## 🛠 Tech Stack

### Backend
- **Runtime**: Node.js (v18+)
- **Framework**: Express.js
- **Database**: SQLite3 (desarrollo), PostgreSQL (producción recomendado)
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: bcrypt
- **SMS**: Twilio API (opcional)

### Frontend
- **Framework**: React 18+
- **Build Tool**: Vite
- **State Management**: Context API + Flux Architecture (mitt event emitter)
- **Styling**: Bootstrap 5 (local)
- **Routing**: React Router DOM
- **HTTP Client**: Axios

## 🚀 Quick Start

### Prerequisites
- Node.js 18 o superior
- npm (incluido con Node.js)
- Git

### 1. Clone the repository

```bash
git clone https://github.com/tu-usuario/incidencias-it.git
cd incidencias-it
```

### 2. Setup Backend

```bash
cd backend
npm install
```

Create `.env` file in `backend/` directory:

```bash
# Required
PORT=3001
NODE_ENV=development
JWT_SECRET=your_super_secret_jwt_key_change_in_production
DATABASE_PATH=./data/helpdesk.db
FRONTEND_URL=http://localhost:5173

# Optional - For SMS notifications
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE=+1234567890
TECHNICIAN_PHONE=+1234567890
```

Seed the database with sample data:

```bash
npm run seed
```

Start the backend development server:

```bash
npm run dev
```

Backend will run on `http://localhost:3001`

### 3. Setup Frontend

```bash
cd ../frontend
npm install
```

Create `.env` file in `frontend/` directory:

```bash
VITE_API_URL=http://localhost:3001
```

Start the frontend development server:

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

### 4. Access the application

Open `http://localhost:5173` in your browser.

**Default users** (created by seed script):
| Email | Password | Role |
|-------|----------|------|
| admin@it.com | password123 | admin |
| tecnico@it.com | password123 | tecnico |
| visor@it.com | password123 | visor |

## 📁 Project Structure

```
incidencias-it/
├── backend/                    # Node.js/Express API
│   ├── src/
│   │   ├── index.js          # Entry point
│   │   ├── routes/           # API routes
│   │   ├── middleware/       # Auth, error handling
│   │   ├── services/         # Business logic
│   │   ├── db/              # Database setup
│   │   └── utils/           # Helpers
│   ├── data/                 # SQLite database file
│   ├── seed.js              # Database seed script
│   ├── package.json
│   └── .env.example
│
├── frontend/                  # React/Vite SPA
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── context/         # AuthContext (Context API)
│   │   ├── actions/         # Flux actions
│   │   ├── stores/          # Flux stores
│   │   ├── services/        # API service layer
│   │   ├── appDispatcher.js # Event emitter (mitt)
│   │   ├── App.jsx          # Main app component
│   │   └── main.jsx         # Entry point
│   ├── public/              # Static assets
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── DEPLOYMENT.md             # Detailed deployment guide
├── render.yaml              # Render deployment config
└── README.md               # This file
```

## 🔧 Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|-----------|-------------|
| `PORT` | No | Port for backend (default: 3001) |
| `NODE_ENV` | No | `development` or `production` |
| `JWT_SECRET` | **Yes** | Secret key for signing JWT tokens |
| `DATABASE_PATH` | No | SQLite file path (default: ./data/helpdesk.db) |
| `FRONTEND_URL` | **Yes** | Frontend URL for CORS (e.g., http://localhost:5173) |
| `TWILIO_ACCOUNT_SID` | No | Twilio Account SID (for SMS) |
| `TWILIO_AUTH_TOKEN` | No | Twilio Auth Token |
| `TWILIO_PHONE` | No | Twilio phone number |
| `TECHNICIAN_PHONE` | No | Default technician phone for SMS |

### Frontend (`frontend/.env`)

| Variable | Required | Description |
|----------|-----------|-------------|
| `VITE_API_URL` | **Yes** | Backend API URL (e.g., http://localhost:3001) |

> **Note**: Vite requires `VITE_` prefix for environment variables to be exposed to the client.

## 📦 Available Scripts

### Backend

```bash
npm start        # Start production server
npm run dev      # Start development server with auto-reload
npm run seed     # Seed database with sample data
```

### Frontend

```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build locally
```

## 🌐 Deployment

### Backend (Render)

1. Push code to GitHub
2. Create new Web Service on [Render](https://render.com)
3. Connect your GitHub repository
4. Configure environment variables (see `backend/.env.example`)
5. Set build command: `npm install`
6. Set start command: `node src/index.js`

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

### Frontend (Vercel)

1. Import project on [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `VITE_API_URL=https://your-backend.onrender.com`
4. Deploy!

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions.

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token

### Incidents
- `GET /api/incidents` - List incidents (with filters & pagination)
- `POST /api/incidents` - Create new incident
- `PUT /api/incidents/:id` - Update incident status

### Notifications
- `POST /api/notifications/sms` - Send SMS (triggered automatically on status change to "Asignada")

## 🏗 Architecture

The application follows a **Flux-like architecture** on the frontend:

```
User Action → Action Creator → Dispatcher (mitt) → Store → View Update
```

### Data Flow
```
React Component → api.js (Axios) → Express API → SQLite Database
                                    ↓
                              Twilio SMS (if status = "Asignada")
```

## 🧪 Testing

Currently, testing is done manually. The following should be tested:

- [ ] User registration and login
- [ ] Incident creation with all fields
- [ ] Incident filtering and pagination
- [ ] Status updates trigger SMS (if Twilio configured)
- [ ] Protected routes redirect to login
- [ ] CORS works between frontend and backend

## 🐛 Known Issues / Limitations

1. **SQLite on Render**: Free tier uses ephemeral filesystem. Database resets on every deploy. For production, use Render's managed PostgreSQL.
2. **Twilio Trial**: Can only send SMS to verified numbers.
3. **Session Storage**: JWT stored in localStorage (consider httpOnly cookies for production).

## 📖 Additional Documentation

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide for Render + Vercel

## 👥 Roles y Permisos

| Role | Permisos |
|------|----------|
| **admin** | Full access: create, update, delete incidents; manage users |
| **tecnico** | View assigned incidents, update status |
| **visor** | View incidents only (read-only) |

## 📄 License

MIT License - Free to use for learning and development.

## ✨ Acknowledgments

- Proyecto desarrollado como parte del curso de 4Geeks Academy
- Stack tecnológico migrado de vanilla JS a React + Node.js durante el desarrollo
- UI basada en Bootstrap 5 con diseño responsive

---

**Development Notes:**
- Phase 6: Deleted vanilla JS (`js/`, `css/`, root `index.html`) - replaced by React
- Phase 7: Backend discovered to be Node.js/Express (not Python/FastAPI as originally designed)
- Phase 8: Cleanup complete - Python artifacts removed, semantic HTML5 verified, README created
