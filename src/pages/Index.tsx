
// This serves as a redirect to the landing page
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/", { replace: true });
  }, [navigate]);

  return null;
};

export default Index;
