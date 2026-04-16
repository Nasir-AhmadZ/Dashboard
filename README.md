This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

To run the complete application, you need to start three services in separate terminals:

### 1. Frontend (Next.js)
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

### 2. Camera Server (Python)
```bash
sudo fuser -k /dev/video0 2>/dev/null; pkill -f camera_server
python camera_server_simple.py
```
This starts the camera stream on port 8080.

### 3. Backend Server (Node.js)
```bash
node server.js
```
This starts the backend API server.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

//http://10.117.215.159:8080