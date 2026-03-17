# CollabCampus™ 
 
© 2026 Ragav K. 
 
CollabCampus is a comprehensive platform designed to streamline campus collaboration and management. 

## Project Structure

This project consists of three main components:

- **admin-app**: A React-based frontend application for administrators.
- **student-app**: A React-based frontend application for students, integrated with Firebase.
- **server**: A Node.js backend using Express and MongoDB.

## Tech Stack

- **Frontend**: React, React Router, Firebase, Axios
- **Backend**: Node.js, Express, MongoDB, Mongoose, NodeMailer, bcryptjs

## Getting Started

To run the project locally, follow these steps:

### Prerequisites

Ensure you have [Node.js](https://nodejs.org/) installed on your machine.

### Installation & Running

#### 1. Server Setup

Navigate to the `server` directory, install dependencies, and start the server:

```bash
cd server
npm install
npm run dev
```
The server will start on its default port (usually 5000).

#### 2. Student App Setup

Open a new terminal, navigate to the `student-app` directory, install dependencies, and start the student frontend:

```bash
cd student-app
npm install
npm start
```
This application typically runs on port 3000.

#### 3. Admin App Setup

Open another terminal, navigate to the `admin-app` directory, install dependencies, and start the admin frontend:

```bash
cd admin-app
npm install
npm start
```
This application typically runs on port 3001.

## License 
 
This project is licensed under the [MIT License](LICENSE). 
