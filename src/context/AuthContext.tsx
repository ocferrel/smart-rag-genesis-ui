
import React, { createContext, useContext, useEffect, useState } from "react";
import { User, AuthState } from "../types";
import { toast } from "sonner";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user data for demo purposes
const MOCK_USERS = [
  {
    id: "1",
    email: "demo@example.com",
    password: "password123",
    name: "Demo User"
  }
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true
  });

  useEffect(() => {
    // Check if user is already logged in (from localStorage)
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setAuthState({
          user,
          isAuthenticated: true,
          isLoading: false
        });
      } catch (error) {
        console.error("Failed to parse stored user", error);
        localStorage.removeItem("user");
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } else {
      setAuthState(prev => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    // This is a mock implementation for demo purposes
    // In a real app, you would make an API call to your authentication service
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const user = MOCK_USERS.find(u => u.email === email && u.password === password);
    
    if (user) {
      const { password: _, ...userWithoutPassword } = user;
      localStorage.setItem("user", JSON.stringify(userWithoutPassword));
      setAuthState({
        user: userWithoutPassword as User,
        isAuthenticated: true,
        isLoading: false
      });
      toast.success("Inicio de sesión exitoso");
    } else {
      toast.error("Credenciales incorrectas");
      throw new Error("Invalid credentials");
    }
  };

  const signup = async (email: string, password: string, name?: string) => {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (MOCK_USERS.some(u => u.email === email)) {
      toast.error("El correo electrónico ya está registrado");
      throw new Error("Email already exists");
    }

    const newUser = {
      id: String(MOCK_USERS.length + 1),
      email,
      name: name || email.split("@")[0],
      password
    };
    
    // In a real app, you would add the user to your database here
    MOCK_USERS.push(newUser);
    
    const { password: _, ...userWithoutPassword } = newUser;
    localStorage.setItem("user", JSON.stringify(userWithoutPassword));
    
    setAuthState({
      user: userWithoutPassword as User,
      isAuthenticated: true,
      isLoading: false
    });
    
    toast.success("Cuenta creada exitosamente");
  };

  const logout = () => {
    localStorage.removeItem("user");
    setAuthState({
      user: null,
      isAuthenticated: false,
      isLoading: false
    });
    toast.info("Sesión cerrada");
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
