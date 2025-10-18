🚀 Full-Stack Real-Time Order & Delivery System

1. Project Overview

This project is a full-stack, real-time quick commerce application designed to simulate a complete order and delivery workflow. It features three distinct user roles with specific functionalities:

Customers: Can register, log in, browse products, place orders, and track the status of their orders in real-time.

Delivery Partners: Can register, log in, view a list of unassigned orders, accept an order (which locks it), and update its status from "accepted" to "delivered".

Admins: Can log in to a dashboard to monitor all orders, view all registered delivery partners, and see live status updates across the system.

The entire application is containerized using Docker and is designed to be self-hosted on a cloud virtual machine (like AWS EC2), with Nginx acting as a reverse proxy.

2. System Architecture Diagram

The application follows a modern, decoupled architecture with a React frontend, a Node.js backend, a MongoDB database, and a real-time WebSocket layer. All services run in separate Docker containers and are managed by an Nginx reverse proxy.

graph TD
    subgraph "Cloud VM (AWS EC2)"
        A[Nginx Reverse Proxy]
        subgraph "Docker Containers"
            B[Frontend - React/Nginx]
            C[Backend - Node.js/Express]
            D[Database - MongoDB]
        end
    end

    U[User's Browser] -->|HTTP/WebSocket| A
    A -->|port 80| B
    A -->|/api/*| C
    A -->|/socket.io/*| C
    C <--> D


3. Stack Used

Category

Technology

Frontend

React.js (with Vite), axios, socket.io-client

Backend

Node.js, Express.js

Database

MongoDB

Real-Time

Socket.io

Auth

JSON Web Tokens (JWT)

Container

Docker, Docker Compose

Hosting

AWS EC2 (Ubuntu)

Web Server

Nginx (as Reverse Proxy)

4. Folder Structure

The project is organized into two main directories, client for the frontend and server for the backend, with containerization files at the root level.

/quick-commerce-app
├── client/
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── package.json
│   └── src/
├── server/
│   ├── Dockerfile
│   ├── package.json
│   └── ... (controllers, models, routes)
│
├── docker-compose.yml
└── README.md


5. Setup Instructions

To run this application, you must have Docker and Docker Compose installed.

Environment Variables Needed

Create a .env file inside the /server directory and add the following:

# /server/.env
PORT=5000
MONGO_URI=mongodb://mongo:27017/quick-commerce-db
JWT_SECRET=your_super_secret_and_long_random_string


Git Clone Steps

Clone the repository to your local machine or server:

git clone <your-repository-url>
cd quick-commerce-app


Docker Compose Up Steps

From the root directory of the project, build and run the application:

docker-compose up --build -d


This will start all services. The frontend will be accessible at http://localhost:3000.

6. Hosting & Deployment Steps

SSH Commands to Login

Connect to your cloud VM (e.g., AWS EC2) using the provided key pair:

# Replace with your key file and server IP
ssh -i /path/to/your-key.pem ubuntu@YOUR_PUBLIC_IP


Deployment

Launch EC2 Instance: Create a t2.micro EC2 instance with Ubuntu and configure the security group to allow traffic on ports 22 (SSH) and 80 (HTTP).

Install Tools: SSH into the server and install Git, Docker, and Docker Compose.

Deploy Code: git clone your repository onto the server.

Set Up Environment: Create the /server/.env file with your production secrets.

Configure Nginx: Install Nginx and configure it as a reverse proxy to direct traffic to the correct Docker containers.

Run Application: From the project root, run docker-compose up --build -d. The application will be live at your server's public IP address.

7. WebSocket Flow Explanation

Real-time communication is managed by Socket.io and is crucial for the application's user experience.

New Order: When a customer places an order, the backend emits a global new_order event. All connected delivery partners and admins receive this instantly.

Order Acceptance: When a delivery partner accepts an order, the backend emits:

A global order_accepted event to notify other partners.

A private order_status_update event to the specific customer's "room" for an instant UI update.

Status Updates: All subsequent status changes are broadcast as global order_status_update events, ensuring the customer and admin dashboards are always in sync.

8. Scaling Plan

How you would add Redis for socket scaling: For a multi-server setup, the default Socket.io memory adapter is insufficient. We would implement the Redis Adapter (socket.io-redis). This allows different backend instances to pass events through a central Redis pub/sub channel, ensuring all users receive real-time updates regardless of which server they are connected to.

Horizontal scaling using Load Balancer: The application can be scaled horizontally by placing multiple backend containers behind a Load Balancer (like an AWS ALB). The Load Balancer would distribute incoming API traffic across the instances, improving performance and reliability. The load balancer must be configured with "sticky sessions" to ensure WebSocket connections are routed consistently to the same server instance.