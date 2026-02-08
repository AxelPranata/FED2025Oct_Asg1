# Hawkers

A web application designed to bring Singapore’s hawker centers online. It connects three key groups — **customers**, **vendors**, and **administrators** — into one seamless ecosystem:

- **Customers**: Browse stalls, order food directly from hawker vendors, and enjoy a streamlined digital ordering experience.
- **Vendors**: Manage stall information, menus, and documentation with ease. Vendors can handle day‑to‑day operations digitally.
- **Administrators**: Gain insights into hawker center performance with dashboards that highlight sales metrics, stall activity, and overall operational health.

<br>

## Table of Contents
- [Features](#features)
- [Technologies Used](#technologies-used)
- [Deployment](#deployment)
- [Project Setup](#project-setup)
- [Credits](#credits)

<br>

## Features
- Responsive UI
- Collapsible hamburger mobile menu
- Create food stall reviews and issue complaints
- Likes for individual food items
- Apply promotion discounts to orders from promotions page

<br>

## Technologies Used

### [JavaScript](https://developer.mozilla.org/en-US/)
- Link Firebase to pages
- Retrieve user‑made data
- Create, remove, update, and delete data in database
- Responsive header and clickable items

### [HTML](https://html.spec.whatwg.org/)
- Skeleton structure of pages
- Allow user input and creation of data

### [CSS](https://www.w3.org/Style/CSS/)
- Design and style of pages
- Responsive pages

### [Firebase](https://firebase.google.com/)
- Implement database
- Track user accounts and data

### [Figma](https://www.figma.com/)
- Plan general layout and design of pages
- Referenced when building actual web application

<br>

## Deployment
[GitHub Pages link](https://axelpranata.github.io/FED2025Oct_Asg1/)

<br>

## Project Setup

### Clone the repo:
```bash
git clone https://github.com/AxelPranata/FED2025Oct_Asg1.git
cd FED2025Oct_Asg1
```

### Install a Local Development Server
Because the app makes dynamic requests to Firebase, you shouldn’t just double‑click `index.html`. Use a local server:
- **VS Code Live Server extension**, or  
- **Node.js http-server**:
```bash
npm install -g http-server
http-server
```

### Set Up Firebase
1.	Go to Firebase Console (console.firebase.google.com in Bing).
2.	Create a new project (e.g., Hawker Web App).
3.	Enable Firestore Database.
4.	Enable Authentication for login flows.
5.	Copy your Firebase config object from Project Settings → Web App → Config

```js
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "your-app.firebaseapp.com",
  projectId: "your-app",
  storageBucket: "your-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdefg"
};
```

### Initialize Firebase in your App
Add or change Firebase configuration to your own for all JavaScript files in your project

### Run the App
- Start your local server (http-server or Live Server).
- Open the server URL (usually http://localhost:8080).

### Note: 
Security Rules: Crucial for protecting your data. Start with test mode, but define rules for customers, vendors, and admins before production

<br>

## Credits
All credits are in credit.md
