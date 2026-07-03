# Tiger License Key Manager - Admin Panel

A secure admin panel for managing license keys for the Tiger Android application.

## Features
- 🔐 Secure login with Google reCAPTCHA
- 🔑 License key generation with multiple algorithms
- 📊 Real-time statistics dashboard
- 🔒 Security logging and monitoring
- 📱 Firebase Realtime Database integration
- 🛡️ Brute force protection
- ⏰ Session timeout management

## Technologies Used
- HTML5/CSS3/JavaScript
- Bootstrap 5
- Firebase (Auth, Realtime Database)
- Google reCAPTCHA v2

## Setup
1. Clone this repository
2. Configure Firebase credentials in `js/firebase-config.js`
3. Update reCAPTCHA site key in `index.html`
4. Deploy to GitHub Pages or Firebase Hosting

## Security
- All authentication handled by Firebase Auth
- CAPTCHA verification required for login
- Automatic session timeout after 30 minutes
- Login attempt limiting (5 attempts, 15-minute lockout)
- All database rules restrict access to authenticated users only

## License
Private - All rights reserved
