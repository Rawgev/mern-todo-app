# 📝 Full Stack Todo Application

A full stack **Todo List Web Application** built using the **MERN Stack**.
This project allows users to create, manage, and delete tasks with a clean user interface and a connected backend API.

The application demonstrates **frontend–backend integration**, REST API usage, and database operations.

---

## 🚀 Features

* Add new tasks
* Delete existing tasks
* Store tasks in database
* Responsive user interface
* REST API based communication
* Full CRUD backend structure

---

## 🛠 Tech Stack

### Frontend

* React.js
* JavaScript
* CSS / Tailwind (if you used it)

### Backend

* Node.js
* Express.js

### Database

* MongoDB (MongoDB Atlas)

### Tools

* Git
* GitHub
* Postman (for API testing)

---

## 📂 Project Structure

```
todo-fullstack-app
│
├── frontend
│   ├── src
│   ├── components
│   └── package.json
│
├── backend
│   ├── routes
│   ├── models
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```
git clone https://github.com/Rawgev/todo-fullstack-app.git
```

### 2️⃣ Go to project directory

```
cd todo-fullstack-app
```

---

### 3️⃣ Backend Setup

```
cd backend
npm install
```

Create a `.env` file and add:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

Start backend server:

```
npm start
```

---

### 4️⃣ Frontend Setup

Open a new terminal:

```
cd frontend
npm install
npm run dev
```

---

## 🌐 API Endpoints

| Method | Endpoint   | Description   |
| ------ | ---------- | ------------- |
| GET    | /tasks     | Get all tasks |
| POST   | /tasks     | Add new task  |
| DELETE | /tasks/:id | Delete a task |

---

## 📸 Project Demo

(Add screenshots here later)

---

## 📚 What I Learned

* Connecting React frontend with Node.js backend
* Creating REST APIs with Express
* Database operations using MongoDB
* Handling asynchronous requests
* Structuring a full stack project

---

## 👨‍💻 Author

**Raghav Chauhan**

GitHub: https://github.com/Rawgev
