import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, User, Lock, Eye, EyeOff, Loader2, CheckCircle, XCircle } from "lucide-react";
import { auth } from "~/services/api";
import { useAuthStore } from "~/store/authStore";

export function meta() {
  return [{ title: "Activar cuenta · FINAZ" }];
}

type Phase = "verifying" | "setup" | "error";

export default function Verify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const saveSession = useAuthStore((s) => s.saveSession);

  const [phase, setPhase] = useState<Phase>("verifying");
  const [errorMsg, setErrorMsg] = useState("");
  const [email, setEmail] = useState("");
  const [setupToken, setSetupToken] = useState("");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    const token = searchParams.get("token");
    if (!token) {
      setErrorMsg("Enlace de verificación inválido.");
      setPhase("error");
      return;
    }
    auth.verifyEmail(token)
      .then((data) => {
        setEmail(data.email);
        setSetupToken(data.setupToken);
        setPhase("setup");
      })
      .catch((err) => {
        setErrorMsg(err.message ?? "El enlace es inválido o ha expirado.");
        setPhase("error");
      });
  }, []);

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const data = await auth.setupProfile({ setupToken, username, password });
      saveSession(data);
      navigate("/");
    } catch (err: any) {
      setFormError(err.message ?? "Error al configurar el perfil");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg shadow-warning/30">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">FINAZ</span>
        </div>

        <AnimatePresence mode="wait">
          {phase === "verifying" && (
            <motion.div
              key="verifying"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-secondary rounded-2xl p-10 flex flex-col items-center gap-4"
            >
              <Loader2 className="h-10 w-10 text-cyan-400 animate-spin" />
              <p className="text-gray-300 text-sm">Verificando enlace…</p>
            </motion.div>
          )}

          {phase === "error" && (
            <motion.div
              key="error"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-secondary rounded-2xl p-10 flex flex-col items-center gap-4 text-center"
            >
              <XCircle className="h-12 w-12 text-red-400" />
              <h2 className="text-white text-xl font-semibold">Enlace inválido</h2>
              <p className="text-gray-400 text-sm">{errorMsg}</p>
              <button
                onClick={() => navigate("/login")}
                className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                Ir al inicio de sesión
              </button>
            </motion.div>
          )}

          {phase === "setup" && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              className="bg-secondary rounded-2xl p-8"
            >
              <div className="flex items-center gap-2 mb-1">
                <CheckCircle className="h-5 w-5 text-cyan-400" />
                <h1 className="text-white text-2xl font-semibold">Configura tu perfil</h1>
              </div>
              <p className="text-gray-400 text-sm mb-8">
                Cuenta verificada para <span className="text-cyan-400">{email}</span>
              </p>

              <form onSubmit={handleSetup} className="space-y-5">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Nombre de usuario</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="tu_nombre"
                      required
                      minLength={3}
                      maxLength={50}
                      className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Contraseña</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      required
                      minLength={6}
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

                {formError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
                  >
                    {formError}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 mt-2"
                >
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Activar mi cuenta"}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
