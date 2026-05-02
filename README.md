# SCMS: Student Concern Management System 

A comprehensive, multi-role mobile ecosystem built with the **MERN Stack** (MongoDB, Express, React Native, Node.js) to streamline communication between students and academic administration. SCMS ensures that student issues—from academic support to medical concerns—are tracked, analyzed, and resolved with transparency and speed.

---

## Key Features

### Student Features
*   **Secure Authentication**: Register and login with verified student credentials.
*   **Concern Submission**: Submit academic, financial, or personal concerns with rich descriptions.
*   **Medical Triage**: Special "Consulting Support" track for medical issues, allowing secure uploads of medical reports.
*   **Real-time Tracking**: Monitor the live status of your reports (Pending → Reviewing → Resolved).
*   **Personalized Notifications**: Receive in-app alerts and branded emails for status updates and admin replies.
*   **Feedback Loop**: Rate the resolution of your concerns to help improve campus services.

### Admin & Consulter Features
*   **Unified Dashboard**: Centralized view of all incoming concerns categorized by type and priority.
*   **Medical Report Viewer**: Specialized access for Consulters to review health documentation securely.
*   **Interactive Triage**: Mark concerns as "Read" (Reviewing) and provide direct replies to students.
*   **Resolution Management**: Close issues with detailed responses that are instantly synced to the student.

### Owner/Executive Features
*   **Semantic Analytics**: High-level insights into concern trends and department performance.
*   **Broadcast System**: Send global "Notices" and announcements to all student feeds simultaneously.
*   **Advanced Reporting**: Generate professional PDF/Excel reports for institutional audits.
*   **Role Management**: Oversee the entire workspace and staff performance metrics.

---

## Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React Native, Expo, React Navigation, Axios, Linear Gradient, Ionicons |
| **Backend** | Node.js, Express.js, MongoDB (Atlas), Mongoose |
| **Security** | JWT (JSON Web Tokens), Bcryptjs (Password Hashing) |
| **Services** | Multer (File Handling), Nodemailer (Email Automation) |
| **Aesthetics** | Custom Glassmorphism UI, Fluid Animations, Dynamic Hero Sections |

---

## Project Structure

```bash
SCMS-Mobile-App/
├── backend/                # Node.js + Express API
│   ├── config/             # Database & Config logic
│   ├── controllers/        # Business logic for all routes
│   ├── models/             # Mongoose Schemas (Concern, Student, etc.)
│   ├── routes/             # API Endpoints
│   ├── utils/              # Mailer & Template utilities
│   └── server.js           # Entry point
├── frontend/               # React Native + Expo Mobile App
│   ├── components/         # Reusable UI elements
│   ├── context/            # Auth & Global state
│   ├── navigation/         # Stack & Tab routing
│   ├── screens/            # Role-specific dashboard screens
│   └── App.jsx             # Main application entry
└── README.md
```

---

## Setup & Installation

### Prerequisites
*   Node.js (v16+)
*   npm or yarn
*   Expo Go app (for mobile testing)
*   MongoDB Atlas account

### 1. Backend Setup
1. Navigate to the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Configure your `.env` file (see `.env.example`):
   ```env
   PORT=5000
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your_email
   SMTP_PASS=your_app_password
   ```
4. Start the server: `npm run dev`

### 2. Frontend Setup
1. Navigate to the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Start the Expo server: `npm start`
4. Scan the QR code with **Expo Go** to run on your device.

---

## Security & Privacy
SCMS prioritizes student data. Medical reports are stored in a dedicated secure directory, and all personal information is transmitted via encrypted API calls with JWT-based authorization.

---

## License
© 2026 AKB Creative Solutions. All rights reserved.
