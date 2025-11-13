import { useState, useEffect } from 'react';
import { UserProfile } from './types';
import HRLogin from './pages/HRLogin';
import HRDashboard from './pages/HRDashboard';
import UserDetails from './pages/UserDetails';
import { apiService } from './services/api';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for an existing session token
    const token = localStorage.getItem('hr-auth-token');
    if (token) {
        try {
            const decodedToken = JSON.parse(atob(token.split('.')[1]));
            if (decodedToken.exp * 1000 > Date.now()) {
                setIsAuthenticated(true);
            } else {
                localStorage.removeItem('hr-auth-token');
            }
        } catch (error) {
            console.error("Invalid token:", error);
            localStorage.removeItem('hr-auth-token');
        }
    }
    setIsLoading(false);
  }, []);

  const handleLoginSuccess = (token: string) => {
    localStorage.setItem('hr-auth-token', token);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('hr-auth-token');
    setIsAuthenticated(false);
    setSelectedUser(null);
  };

  const handleSelectUser = async (userId: string) => {
    try {
        const user = await apiService.getUserById(userId);
        setSelectedUser(user);
    } catch(error) {
        console.error("Failed to fetch user details:", error);
        alert(error instanceof Error ? error.message : "Could not fetch user.");
    }
  };
  
  const handleBackToDashboard = () => {
    setSelectedUser(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900">
        <div className="w-16 h-16 border-4 border-blue-500 border-dashed rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <HRLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100">
      {selectedUser ? (
        <UserDetails user={selectedUser} onBack={handleBackToDashboard} />
      ) : (
        <HRDashboard onSelectUser={handleSelectUser} onLogout={handleLogout} />
      )}
    </div>
  );
}
