import { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, User, Lock, Eye, EyeOff, Upload, Loader2, CheckCircle, XCircle } from "lucide-react";
import { auth, storage } from "~/services/api";
import { useAuthStore } from "~/store/authStore";

export function meta() {
  return [{ title: "Activar cuenta · FINZ" }];
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

  // Setup form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [profileImageUrl, setProfileImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await storage.upload(file, "avatars");
      setProfileImageUrl(url);
    } catch {
      setFormError("No se pudo subir la imagen. Intenta de nuevo.");
    } finally {
      setUploading(false);
    }
  }

  async function handleSetup(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);
    try {
      const data = await auth.setupProfile({
        setupToken,
        username,
        password,
        ...(profileImageUrl ? { profileImageUrl } : {}),
      });
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
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg shadow-warning/30">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">FINZ</span>
        </div>

        <AnimatePresence mode="wait">
          {/* Verifying */}
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

          {/* Error */}
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

          {/* Setup form */}
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
                {/* Avatar */}
                <div className="flex flex-col items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="relative w-20 h-20 rounded-full bg-gray-800 border-2 border-gray-700 hover:border-cyan-500 overflow-hidden transition-colors flex items-center justify-center group"
                  >
                    {profileImageUrl ? (
                      <img src={profileImageUrl} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User className="h-8 w-8 text-gray-500 group-hover:text-cyan-400 transition-colors" />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                        <Loader2 className="h-5 w-5 text-cyan-400 animate-spin" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 flex items-center justify-center py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Upload className="h-3 w-3 text-white" />
                    </div>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <p className="text-gray-500 text-xs">Foto de perfil (opcional)</p>
                </div>

                {/* Username */}
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

                {/* Password */}
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
                  disabled={submitting || uploading}
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
