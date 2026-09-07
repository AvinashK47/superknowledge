import express, { Request, Response } from 'express';

const app = express();
app.use(express.json());

app.get("/api/health", (req: Request, res: Response) => {
  res.json({ message: "Backend is working and live on Port 8000!" });
  console.log("Health Endpoint hit!!!");
});

const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Backend Server running at http://localhost:${PORT}`);
});
