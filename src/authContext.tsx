import {
  createContext,
  useState,
  useContext,
  type ReactNode,
  useEffect,
} from "react";
import authService from "./authService.ts";

interface UserProfile {
  id: number;
  display_name: string;
  email: string;
  roles: string[];
  store?: string;
}

interface AuthContextType {
  userProfile: UserProfile | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const ALLOWED_ROLES = ["administrator", "director", "gm", "general_manager"];

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchProfileOnLoad = async () => {
      const cachedProfile = sessionStorage.getItem("userProfile");

      if (cachedProfile && cachedProfile !== "undefined" && cachedProfile !== "null") {
        try {
          const parsed = JSON.parse(cachedProfile);
          const hasAllowedRole = parsed.roles?.some((role: string) => 
            ALLOWED_ROLES.includes(role.toLowerCase())
          );
          if (hasAllowedRole) {
            setUserProfile(parsed);
          }
        } catch (e) {
          sessionStorage.removeItem("userProfile");
        }
      }

      try {
        const freshProfile = await authService.getUserProfile();
        if (freshProfile) {
          const hasAllowedRole = freshProfile.roles?.some((role: string) => 
            ALLOWED_ROLES.includes(role.toLowerCase())
          );
          if (hasAllowedRole) {
            setUserProfile(freshProfile);
          } else {
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
      } catch (e) {
        setUserProfile(null);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileOnLoad();
  }, []);

  const login = async (username: string, password: string) => {
    try {
      await authService.login(username, password);
      const profile = await authService.getUserProfile();
      
      if (!profile) {
        throw new Error("Could not retrieve user profile.");
      }

      const hasAllowedRole = profile.roles?.some((role: string) => 
        ALLOWED_ROLES.includes(role.toLowerCase())
      );

      if (!hasAllowedRole) {
        authService.logout();
        throw new Error("Access Denied: You do not have the required role to view this dashboard.");
      }

      sessionStorage.setItem("userProfile", JSON.stringify(profile));
      setUserProfile(profile);
      
    } catch (error: any) {
      if (error.response && error.response.status >= 400) {
        throw new Error("Login failed. Please check your username and password.");
      }
      throw error;
    }
  };

  const logout = () => {
    authService.logout();
    sessionStorage.removeItem("userProfile");
    setUserProfile(null);
  };

  const value = {
    userProfile,
    login,
    logout,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};