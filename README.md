# Task Board API

This is a RESTful API for managing tasks within an organization, demonstrating Role-Based Access Control (RBAC). The application provides CRUD functionality for tasks, users, organizations, and roles. It also includes middleware for authorization, user role management, and error handling.

## Features

- **Authorization Middleware:** Ensures that users are authorized to access specific resources.
- **Role Middleware:** Defines user roles and enforces permissions based on roles.
- **Error Handling Middleware:** Catches and handles errors throughout the application.
- **Task Management:** Allows users to create, update, delete, and manage the status of tasks.
- **User Management:** Handles CRUD operations for users and user verification.
- **Organization Management:** CRUD operations for organizations, including member management and invitations.
- **Role Management:** Allows administrators to manage roles within an organization, including assigning permissions related to tasks, users, and organizations.

## schema

![ER Diagram](https://github.com/VivekYadav105/task-board/blob/master/ERD.svg)

## Setup
1. Clone the repository:
<pre>
  git clone <repository_url>
  cd task-board  
</pre>
<br/>
2. Install dependencies:
<pre>npm install</pre>
3. create a new .env file and add the following variables
<pre>
DATABASE_URL=prisma+postgres://<your_database_url>
PULSE_API_KEY=<your_pulse_api_key>
FRONTEND_URL=anythinh
JWT_SECRET_MAIN=<your_jwt_secret_main>
JWT_SECRET_TEMP=<your_jwt_secret_temp>
INVITE_SECRET=<your_invite_secret>
MAIL_USERNAME=<your_email>
MAIL_PASSWORD=<your_email_password>
NODE_FRONTEND_URL= anything 
</pre>
4. Run the application
   `nodemon start` or `node index.js`


