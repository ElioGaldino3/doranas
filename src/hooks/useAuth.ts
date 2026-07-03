import { useContext } from "react";
import { signInWithPopup, signOut } from "firebase/auth";
import { auth, provider } from "../lib/firebase";
import { AuthContext } from "../context/AuthContext";

export function useAuth() {
  const { user, loading } = useContext(AuthContext);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  return { user, loading, login, logout };
}
