import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { motion } from "framer-motion";
import { Zap, Lock, Loader2, Eye, EyeOff, CheckCircle, XCircle } from "lucide-react";
import { auth } from "~/services/api";

export function meta() {
  return [{ title: "Restablecer contraseña · FINZ" }];
}

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <ResetShell>
        <div className="flex flex-col items-center text-center gap-4">
          <XCircle className="h-12 w-12 text-red-400" />
          <h1 className="text-white text-xl font-semibold">Enlace inválido</h1>
          <p className="text-gray-400 text-sm">
            El enlace de recuperación no es válido o está incompleto. Pedí uno nuevo desde la página de login.
          </p>
          <a
            href="/login"
            className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
          >
            Ir al inicio de sesión
          </a>
        </div>
      </ResetShell>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      await auth.resetPassword(token, password);
      setDone(true);
      setTimeout(() => navigate("/login"), 2200);
    } catch (err: any) {
      setError(err.message ?? "No se pudo restablecer la contraseña. Pedí un enlace nuevo.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <ResetShell>
        <div className="flex flex-col items-center text-center gap-4">
          <CheckCircle className="h-12 w-12 text-emerald-400" />
          <h1 className="text-white text-xl font-semibold">Contraseña actualizada</h1>
          <p className="text-gray-400 text-sm">
            Listo. Ya podés iniciar sesión con tu nueva contraseña.
          </p>
          <p className="text-gray-600 text-xs">Redirigiendo al login…</p>
        </div>
      </ResetShell>
    );
  }

  return (
    <ResetShell>
      <h1 className="text-white text-2xl font-semibold mb-1">Nueva contraseña</h1>
      <p className="text-gray-400 text-sm mb-8">
        Elegí una contraseña segura para tu cuenta.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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

        <div>
          <label className="block text-sm text-gray-400 mb-1.5">Confirmar contraseña</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type={showPassword ? "text" : "password"}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Repetí la contraseña"
              required
              minLength={6}
              className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
            />
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2"
          >
            {error}
          </motion.p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2 mt-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cambiar contraseña"}
        </button>
      </form>
    </ResetShell>
  );
}

function ResetShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg shadow-warning/30">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">FINZ</span>
        </div>

        <div className="bg-secondary rounded-2xl p-8">
          {children}
        </div>
      </motion.div>
    </div>
  );
}
