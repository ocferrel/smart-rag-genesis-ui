
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";

const Login = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background to-rag-lightPurple p-4">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2 gradient-text">Smart RAG con Pydantic</h1>
        <p className="text-muted-foreground max-w-md mx-auto">
          Implementación de RAG (Retrieval-Augmented Generation) con agentes Pydantic y modelos de OpenRouter
        </p>
      </div>
      
      <LoginForm />
    </div>
  );
};

export default Login;
