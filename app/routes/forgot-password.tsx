import { useState } from "react";
import { motion } from "framer-motion";
import { Zap, Mail, Loader2, ArrowLeft, CheckCircle } from "lucide-react";
import { auth } from "~/services/api";

export function meta() {
  return [{ title: "Recuperar contraseña · FINAZ" }];
}

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await auth.forgotPassword(email);
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message ?? "No se pudo enviar el correo. Intentalo de nuevo.");
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
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-10 h-10 bg-warning rounded-lg flex items-center justify-center shadow-lg shadow-warning/30">
            <Zap className="text-white h-6 w-6" />
          </div>
          <span className="text-white font-bold text-3xl tracking-tight">FINAZ</span>
        </div>

        <div className="bg-secondary rounded-2xl p-8">
          {submitted ? (
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle className="h-12 w-12 text-emerald-400" />
              <h1 className="text-white text-xl font-semibold">Revisá tu correo</h1>
              <p className="text-gray-400 text-sm">
                Si <span className="text-cyan-400">{email}</span> está registrado en FINAZ,
                en unos segundos te llegará un enlace para elegir una nueva contraseña.
                El enlace expira en 1 hora.
              </p>
              <a
                href="/login"
                className="mt-2 flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </a>
            </div>
          ) : (
            <>
              <h1 className="text-white text-2xl font-semibold mb-1">¿Olvidaste tu contraseña?</h1>
              <p className="text-gray-400 text-sm mb-8">
                Ingresá tu correo y te enviamos un enlace para recuperarla.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-1.5">Correo electrónico</label>
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
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar enlace"}
                </button>
              </form>

              <a
                href="/login"
                className="mt-6 flex items-center justify-center gap-1.5 text-gray-500 hover:text-gray-300 text-sm transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Volver al inicio de sesión
              </a>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
