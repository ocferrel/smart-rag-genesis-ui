
import { ConversationSidebar } from "@/components/ConversationSidebar";
import { ChatInterface } from "@/components/ChatInterface";
import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, isLoading, navigate]);
  
  // Don't render anything while checking authentication
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 rounded-full bg-primary/20"></div>
          <div className="h-4 w-24 rounded-full bg-primary/20"></div>
        </div>
      </div>
    );
  }
  
  // If not authenticated, don't render content
  if (!isAuthenticated) {
    return null;
  }
  
  return (
    <div className="flex h-screen overflow-hidden">
      <ConversationSidebar />
      <ChatInterface />
    </div>
  );
};

export default Dashboard;
