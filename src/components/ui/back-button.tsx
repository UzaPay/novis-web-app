import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function BackButton({
  fallback = "/",
  label = "Back",
  className = "",
  icon: Icon = ArrowLeft,
}) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  };

  return (
    <button
      onClick={handleBack}
      className={`inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground ${className}`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}