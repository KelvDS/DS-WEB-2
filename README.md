# Da'perfect Studios Films Web System

Full-stack photography gallery management system with JWT authentication, watermarking, and client/admin portals.

## Features

- **Authentication**: JWT-based auth with bcrypt password hashing
- **Roles**: Super Admin, Admin, and Client
- **Image Management**: Automatic watermarking with Sharp (tilted, semi-transparent)
- **Client Features**: View galleries, favorite images, select for processing, request high-res
- **Admin Features**: Create galleries, upload images, assign clients, manage requests
- **Dark Theme**: Modern UI with gold (#FFD700) and blue (#1E90FF) accents

## Installation & Setup

### 1. Install Dependencies

**Server:**
```bash
cd server
npm install
```

**Client:**
```bash
cd client
npm install
```

### 2. Run the Application

**Terminal 1 - Server:**
```bash
cd server
npm run dev
```

**Terminal 2 - Client:**
```bash
cd client
npm run dev
```

### 3. Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

### 4. Pre-seeded Super Admin

- **Email**: kelvrambo@gmail.com
- **Password**: Kelv2580

## Tech Stack

- **Backend**: Node.js, Express, SQLite, JWT, bcrypt, Sharp, Nodemailer
- **Frontend**: React, Vite, Tailwind CSS, React Router

## License

MIT