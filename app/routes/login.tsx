import { useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "framer-motion";
import { Zap, Mail, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { auth } from "~/services/api";
import { useAuthStore } from "~/store/authStore";

export function meta() {
  return [{ title: "Iniciar sesión · FINZ" }];
}

export default function Login() {
  const navigate = useNavigate();
  const saveSession = useAuthStore((s) => s.saveSession);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await auth.login(email, password);
      saveSession(data);
      navigate("/");
    } catch (err: any) {
      setError(err.message ?? "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg shadow-warning/30">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">FINZ</span>
        </div>

        {/* Card */}
        <div className="bg-secondary rounded-2xl p-8">
          <h1 className="text-white text-2xl font-semibold mb-1">Bienvenido</h1>
          <p className="text-gray-400 text-sm mb-8">
            Inicia sesión para ver tus finanzas
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Correo electrónico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@correo.com"
                  required
                  className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm text-gray-400 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full bg-gray-800 text-white pl-10 pr-10 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Iniciar sesión"
              )}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            ¿No tienes cuenta?{" "}
            <a href="/register" className="text-cyan-400 hover:text-cyan-300 transition-colors">
              Regístrate
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
