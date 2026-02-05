import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext(null);

// ✅ Your EXISTING Apps Script Web App URL
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyKUvX_uKYhR0j1lfZ1C7Qb2u9bygHTzf__nbuYE1atWWlEikxYQdklOvfSy5D0BYQJ/exec";

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // 🔹 LOGIN USING GOOGLE SHEET
 const login = async (id, password) => {
  try {

    const res = await fetch(`${SCRIPT_URL}?sheet=USER`);
    const result = await res.json();

    if (!result.success) return false;

    const rows = result.data;
    rows.shift(); // remove header

    const users = rows.map(r => ({
      name: r[0],
      id: String(r[1]),
      password: String(r[2]),
      role: r[3]
    }));

    console.log("Users loaded:", users);

    const foundUser = users.find(
      u => u.id === String(id) && u.password === String(password)
    );

    if (!foundUser) return false;

    const safeUser = {
      id: foundUser.id,
      name: foundUser.name,
      role: foundUser.role
    };

    setUser(safeUser);
    localStorage.setItem("user", JSON.stringify(safeUser));
    return true;

  } catch (err) {
    console.error("Login error:", err);
    return false;
  }
};


  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
