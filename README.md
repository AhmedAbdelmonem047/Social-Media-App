# 🧩 Social Post & Comment API (Node.js + Express + Mongoose)

A RESTful backend built with **Node.js**, **Express**, and **Mongoose**, featuring:
- Full user authentication & account management
- Social interactions (friends, blocking, freezing)
- Nested comment & reply system
- Cascade deletion (posts → comments → replies)
- Event-based email notifications for tagged users

---

## 🚀 Features

### 👤 User Features
- Signup / Login with hashed passwords
- Forgot & Reset Password via email
- Update Profile
- Friend Requests (send, accept)
- Block / Unblock users
- Freeze / Delete account
- Cascade deletion of all related data when deleting user

### 📝 Post & Comment Features
- Create, read, update, delete posts
- Nested comments and replies using one model
- Cascade delete logic for posts → comments → replies
- Event-based email notifications when users are tagged

---

## 📦 Tech Stack

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **bcryptjs** (password hashing)
- **jsonwebtoken (JWT)** (auth)
- **Nodemailer**
- **EventEmitter**
- **dotenv**
- **Multer (optional)** for profile images

---

## 🪪 License

This project is licensed under the MIT License.
