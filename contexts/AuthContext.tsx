
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Permissions } from '../types';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  permissions: Permissions;
  login: (role: UserRole) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define capabilities for each role
const ROLE_PERMISSIONS: Record<UserRole, Permissions> = {
  [UserRole.SUPER_ADMIN]: { canManageSystem: true, canManageEvent: true, canScore: true, canVerify: true, canManageClub: true, canViewRestricted: true },
  [UserRole.EVENT_ADMIN]: { canManageSystem: false, canManageEvent: true, canScore: true, canVerify: true, canManageClub: false, canViewRestricted: true },
  [UserRole.REFEREE]: { canManageSystem: false, canManageEvent: false, canScore: true, canVerify: true, canManageClub: false, canViewRestricted: true },
  [UserRole.TECHNICAL_OFFICER]: { canManageSystem: false, canManageEvent: false, canScore: false, canVerify: true, canManageClub: false, canViewRestricted: true },
  [UserRole.CLUB_ADMIN]: { canManageSystem: false, canManageEvent: false, canScore: false, canVerify: false, canManageClub: true, canViewRestricted: true },
  [UserRole.PLAYER]: { canManageSystem: false, canManageEvent: false, canScore: false, canVerify: false, canManageClub: false, canViewRestricted: false },
  [UserRole.GUEST]: { canManageSystem: false, canManageEvent: false, canScore: false, canVerify: false, canManageClub: false, canViewRestricted: false },
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Default to Super Admin for demo purposes
  const [user, setUser] = useState<User | null>({ id: '1', username: 'Demo Admin', role: UserRole.SUPER_ADMIN });

  const login = (role: UserRole) => {
    setUser({ id: '1', username: `Demo ${role}`, role });
  };

  const logout = () => {
    setUser(null);
  };

  const role = user?.role || UserRole.GUEST;
  const permissions = ROLE_PERMISSIONS[role];

  return (
    <AuthContext.Provider value={{ user, role, permissions, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
