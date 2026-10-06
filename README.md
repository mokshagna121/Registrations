# ⚡ HACKCHECK — Hackathon Registration & Attendance System

A modern, fast, and resilient **Hackathon Registration & Attendance Management System** designed for registration desks and event volunteers. Built entirely with Vanilla JavaScript, HTML5, CSS3, and browser LocalStorage — **no backend or database required**.

---

## 🌟 Key Features

- **📷 QR Code Scanning**:
  - Live webcam / camera scanning using `html5-qrcode`.
  - Continuous scan mode with automatic return timers.
  - Physical barcode / handheld USB scanner wedge support.
  - Manual code input with instant validation.
- **✉ Automatic QR Generation & Email Dispatch**:
  - Automatically generates unique check-in QR codes for every participant upon team creation.
  - Direct in-browser automated email sending via **EmailJS** (free tier, no backend).
  - 1-click **Mail Client (`mailto:`)** fallback for instant manual sending with pre-filled details.
  - **🖨 Print Badges / QR Passes**: Printable grid of participant badges with QR codes and team branding.
- **👥 Team & Participant Management**:
  - Add, edit, view, and delete teams and participants.
  - Real-time search by team name, ID, college, participant name, roll number, or email.
- **📁 CSV Import & Export**:
  - Drag-and-drop or paste CSV import with preview and validation.
  - 4 CSV export formats: Complete attendance, Present only, Pending only, and Team summary.
- **🔊 Audio Feedback**:
  - Web Audio API sound effects for success, duplicate, and error scans.
- **💾 Data Resilience**:
  - All data persisted locally in `localStorage`.
  - JSON backup and restore functionality.
  - Reset event data with safety confirmation.

---

## 🚀 Getting Started

### Option 1: Open Directly
Simply open `index.html` in any modern web browser (Chrome, Edge, Firefox, Safari).

### Option 2: Local HTTP Server (Recommended for Camera Access)
To ensure camera permissions work seamlessly in all browsers:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Open `http://localhost:8000` in your browser.

---

## 📁 Project Structure

```
├── index.html                  # Main application entry point
├── sample_participants.csv     # Sample data for testing CSV import
├── css/
│   └── style.css               # Complete responsive dark-theme design system
└── js/
    ├── app.js                  # Core state, navigation & business logic
    ├── csv.js                  # CSV parser and exporter
    ├── pages.js                # View renderers (Dashboard, Scanner, Teams, Settings, etc.)
    ├── qremail.js              # QR code generation & EmailJS dispatch module
    ├── scanner.js              # Camera & hardware barcode scanner controller
    ├── storage.js              # LocalStorage manager with schema versioning
    ├── ui.js                   # UI shell, modal manager, toast notifications
    └── utils.js                # Helper utilities, audio synthesis, formatting
```

---

## ✉ EmailJS Setup (Optional for Automated Emails)

1. Create a free account at [emailjs.com](https://www.emailjs.com).
2. Connect your email service (e.g. Gmail) to get a **Service ID**.
3. Create an email template with parameters `{{to_name}}`, `{{team_name}}`, `{{qr_id}}`, and `<img src="{{qr_image}}" width="200" />` to get a **Template ID**.
4. Copy your **Public Key** from Account Settings.
5. In HACKCHECK, go to **Settings → Email & QR Dispatch**, paste your keys, and click **Save Email Config**.

---

## 📄 License

MIT License. Designed and built for hackathon organizers and volunteers.
