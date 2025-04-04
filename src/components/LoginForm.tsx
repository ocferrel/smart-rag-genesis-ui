
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<string>("login");
  const { login, signup } = useAuth();
  
  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  
  // Signup form state
  const [signupEmail, setSignupEmail] = useState("");
  const [signupName, setSignupName] = useState("");
  const [signupPassword, setSignupPassword] = useState("");
  const [signupConfirmPassword, setSignupConfirmPassword] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(loginEmail, loginPassword);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (signupPassword !== signupConfirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }
    
    setIsLoading(true);
    
    try {
      await signup(signupEmail, signupPassword, signupName);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-[400px] shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center gradient-text">
          Smart RAG con Pydantic
        </CardTitle>
        <CardDescription className="text-center">
          Inicia sesión o crea una cuenta para continuar
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
            <TabsTrigger value="signup">Crear cuenta</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login">
            <form onSubmit={handleLogin}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Correo electrónico</Label>
                  <Input 
                    id="login-email" 
                    type="email" 
                    value={loginEmail} 
                    onChange={(e) => setLoginEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Button 
                      variant="link" 
                      size="sm" 
                      className="text-xs text-muted-foreground"
                      type="button"
                    >
                      ¿Olvidaste tu contraseña?
                    </Button>
                  </div>
                  <Input 
                    id="login-password" 
                    type="password" 
                    value={loginPassword} 
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required 
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Iniciar sesión
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="signup">
            <form onSubmit={handleSignup}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Correo electrónico</Label>
                  <Input 
                    id="signup-email" 
                    type="email" 
                    value={signupEmail} 
                    onChange={(e) => setSignupEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Nombre (opcional)</Label>
                  <Input 
                    id="signup-name" 
                    type="text"
                    value={signupName} 
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder="Tu nombre" 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Contraseña</Label>
                  <Input 
                    id="signup-password" 
                    type="password"
                    value={signupPassword} 
                    onChange={(e) => setSignupPassword(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirmar contraseña</Label>
                  <Input 
                    id="signup-confirm-password" 
                    type="password"
                    value={signupConfirmPassword} 
                    onChange={(e) => setSignupConfirmPassword(e.target.value)} 
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Crear cuenta
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <p>
          {activeTab === "login" ? "¿No tienes una cuenta? " : "¿Ya tienes una cuenta? "}
          <Button 
            variant="link" 
            className="p-0 h-auto"
            onClick={() => setActiveTab(activeTab === "login" ? "signup" : "login")}
          >
            {activeTab === "login" ? "Regístrate" : "Inicia sesión"}
          </Button>
        </p>
      </CardFooter>
    </Card>
  );
}
