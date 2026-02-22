export default function handler(req, res) {
    if (req.method === "GET") {
      res.status(200).json([
        {
          id: 1,
          name: "Dr. John",
          department: "Cardiology"
        },
        {
          id: 2,
          name: "Dr. Smith",
          department: "Neurology"
        }
      ]);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  }