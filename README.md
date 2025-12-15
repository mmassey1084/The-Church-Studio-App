# 🎵 The Church Studio App

The **Church Studio App** is a cross-platform mobile and web application designed to enhance the visitor experience for **The Church Studio** in Tulsa, Oklahoma — a historic recording studio and music museum founded by Leon Russell.

This app serves as a digital companion for visitors, members, and fans, providing access to interactive tours, archival content, events, and exclusive experiences while preserving the studio’s legacy.

---

## 📌 Purpose & Vision

The goal of The Church Studio App is to:

* Provide an engaging, modern way to explore the history of The Church Studio
* Offer interactive and accessible content for both in-person and remote users
* Centralize events, archives, audio experiences, and member access in one platform
* Support the studio’s mission of preservation, education, and community engagement

---

## ✨ Key Features

* **Interactive Virtual Tour**
  Explore the studio through guided digital experiences and immersive content

* **Archive Access**
  Browse curated historical materials, photos, and stories from The Church Studio’s legacy

* **Listen In**
  Experience audio content, interviews, and music tied to the studio’s history

* **Events & Programming**
  View upcoming events, shows, and special programs

* **Studio Guide**
  Learn about rooms, equipment, artists, and architectural details

* **Backstage Pass (Membership)**
  Access exclusive content and experiences for members

* **External Merch Store Integration**
  Quick access to official Church Studio merchandise

---

## 🛠️ Tech Stack

**Frontend**

* React
* React Router
* Vite
* CSS / Custom UI components

**Mobile & Platform**

* Capacitor (iOS / Android builds)
* Progressive Web App (PWA) support

**Backend / Services**

* Node.js
* Express
* Firebase (Analytics, Notifications)
* Third-party APIs (events, subscriptions, content)

---

## 📱 Platforms

* iOS
* Android
* Web (PWA)

---

## 🧭 Project Structure (High-Level)

```
church-studio-app/
├── src/
│   ├── components/
│   ├── pages/
│   ├── assets/
│   ├── styles/
│   └── utils/
├── public/
├── capacitor.config.ts
├── vite.config.js
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

* Node.js (v18+ recommended)
* npm or yarn
* Git

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/church-studio-app.git

# Navigate into the project
cd church-studio-app

# Install dependencies
npm install

# Start development server
npm run dev
```

---

## 🔐 Environment Variables

This project uses environment variables for configuration. Create a `.env` file in the root directory based on the example below:

```env
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_ANALYTICS_ID=
```

> **Note:** Never commit real API keys or secrets to GitHub.

---

## ♿ Accessibility & UX

Accessibility and usability are core priorities of this project:

* Semantic HTML and ARIA roles where appropriate
* Keyboard-friendly navigation
* Screen-reader considerations
* Clear visual hierarchy and readable typography

---

## 🧪 Development Status

This project is actively developed and maintained as part of an ongoing internship and academic experience. Features and structure may evolve as the app continues to grow.

---

## 👤 Author

**Michael Massey**
Software Developer Intern
University of Oklahoma – Information Science & Technology

* GitHub: [https://github.com/mmassey1084](https://github.com/mmassey1084)
* LinkedIn: [https://www.linkedin.com/in/michael-massey-488496132](https://www.linkedin.com/in/michael-massey-488496132)

---

## 🏛️ About The Church Studio

The Church Studio is a legendary recording studio and museum located in Tulsa, Oklahoma. Founded by Leon Russell in 1972, it has hosted countless iconic artists and continues to serve as a space for music, history, and creativity.

Learn more at: [https://thechurchstudio.com](https://thechurchstudio.com)

---

## 📄 License

This project is proprietary and developed for The Church Studio. All rights reserved unless otherwise specified.
