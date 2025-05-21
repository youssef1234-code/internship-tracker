import { Button } from "@/components/ui/button"
import { useNavigate } from "react-router-dom"

export default function BackToHomePage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="text-center space-y-4">
        <p className="text-2xl font-semibold">Click below to go back to the login page.</p>
        <Button onClick={() => navigate("/login")}>Back to Home</Button>
      </div>
    </div>
  );
}
