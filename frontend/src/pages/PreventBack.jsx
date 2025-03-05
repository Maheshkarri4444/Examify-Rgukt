import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const PreventBack = () => {
  const navigate = useNavigate();

  useEffect(() => {
    window.history.pushState(null, "", window.location.href);

    const handleBack = (event) => {
      event.preventDefault();
      window.history.pushState(null, "", window.location.href);
      navigate(0); // Force reload to prevent going back
    };

    // Detect back button and prevent it
    window.addEventListener("popstate", handleBack);
    window.addEventListener("beforeunload", handleBack); // Blocks refresh as well

    return () => {
      window.removeEventListener("popstate", handleBack);
      window.removeEventListener("beforeunload", handleBack);
    };
  }, [navigate]);

  return null;
};

export default PreventBack;
