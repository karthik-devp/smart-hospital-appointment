export default function handler(req, res) {
    if (req.method === "GET") {
      res.status(200).json([
        {
          id: 1,
          name: "Dr. Smith",
          department: "Neurology"
        },
        {
          id: 2,
          name: "Dr. Kumar",
          department: "Cardiology"
        }
      ]);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }