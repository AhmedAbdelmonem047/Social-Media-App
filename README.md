# Social Media API

A social-media backend built with **Node.js, TypeScript, Express 5, MongoDB, and Mongoose**. It exposes REST endpoints for user and post workflows, a GraphQL endpoint, and a Socket.IO gateway for real-time features.

## Features

### Accounts and social relationships

- User registration, login, and profile management
- JWT access and refresh tokens
- Google Sign-In
- Password hashing with `bcrypt`
- Email confirmation and password-reset flows
- Friend requests, blocking/unblocking, and account freeze/delete workflows
- Related-data cleanup when accounts or posts are deleted

### Posts and interactions

- Post management through REST endpoints
- Nested comments and replies
- Notifications when users are tagged
- MongoDB persistence with Mongoose

### API and integrations

- REST API mounted under `/users` and `/posts`
- GraphQL endpoint at `/graphql`
- Socket.IO gateway for real-time communication
- AWS S3 utilities for uploading, retrieving, and generating signed URLs for files
- Express middleware for JSON parsing, CORS, security headers, and error responses
- Zod-based request validation in the application

## Tech Stack

| Area | Technologies |
|---|---|
| Runtime and language | Node.js, TypeScript |
| HTTP framework | Express 5 |
| Database | MongoDB, Mongoose |
| API styles | REST, GraphQL (`graphql-http`) |
| Real-time | Socket.IO |
| Authentication | JWT, bcrypt, Google OAuth client |
| Validation | Zod |
| Email | Nodemailer / event-driven notifications |
| File storage | AWS S3 SDK, presigned URLs |
| Middleware | CORS, Helmet, Express Rate Limit |

## Getting Started

### Prerequisites

- Node.js and npm
- MongoDB (local or hosted)
- AWS S3 credentials if you want to use media/file-storage features
- Google OAuth web client ID if you want to test Google Sign-In
- Email-service credentials for email confirmation and password-reset flows

### Install

```bash
git clone https://github.com/AhmedAbdelmonem047/Social-Media-App.git
cd Social-Media-App
npm install
```

The application loads environment configuration from `config/.env` relative to the repository's working directory. Create that file and set the values needed by the features you plan to test. **Never commit real credentials.**

```dotenv
PORT=5000
DB_URL=mongodb://127.0.0.1:27017/social_media

# Use long, unique values for token signing secrets
ACCESS_TOKEN_USER=replace_with_a_long_random_secret
ACCESS_TOKEN_ADMIN=replace_with_a_different_long_random_secret
REFRESH_TOKEN_USER=replace_with_another_long_random_secret
REFRESH_TOKEN_ADMIN=replace_with_another_long_random_secret

# Google Sign-In
WEB_CLIENT_ID=your_google_oauth_web_client_id

# AWS S3 (required for media storage functionality)
AWS_REGION=your_aws_region
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_access_key
AWS_BUCKET_NAME=your_bucket_name
APPLICATION_NAME=social-media-app
```

Configure the email-delivery values required by the mail/event modules before testing email confirmation or password-reset flows. The server defaults to port `5000` when `PORT` is not set. `DB_URL` is required for MongoDB connectivity.

## Run Locally

```bash
npm start
```

The current `start` script runs the TypeScript compiler in watch mode alongside Nodemon for `dist/index.js`. If the server fails on a clean checkout, check the TypeScript compiler output first and verify that the generated `dist/` entry point exists.

Once started, the application listens at `http://localhost:5000` unless another `PORT` is configured.

## Main Endpoints

| Path | Purpose |
|---|---|
| `GET /` | Basic welcome response |
| `/users` | User and authentication routes |
| `/posts` | Post and related interaction routes |
| `/graphql` | GraphQL endpoint |
| `/upload/*path` | Retrieves a stored file by its S3 object key/path |
| Socket.IO | Real-time gateway initialised with the HTTP server |

The `/users` and `/posts` paths are route prefixes. Review the corresponding controller files in `src/modules/` for the complete endpoint list, HTTP methods, validation rules, and payloads.

## Security and Configuration Notes

- Use separate, unpredictable access-token and refresh-token secrets.
- Do not commit `config/.env`, cloud credentials, OAuth client configuration, or email credentials.
- The rate limiter is defined in the application bootstrap, but its `app.use(limiter)` line is currently commented out. Do not assume the global limiter is active unless you enable and test it.
- Review error responses and logging before any production deployment; development stack traces should not be returned to public clients.

## Project Status

This is a portfolio project demonstrating REST and GraphQL APIs, authentication, database modelling, event-driven email workflows, file storage, and real-time communication. External services need to be configured separately; no credentials or hosted backend are included in the repository.
