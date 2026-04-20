import { DashboardLayout } from "~/components/templates";
import { motion } from "framer-motion";
import { Loader2, Save, User, Target, LogOut } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuthStore } from "~/store/authStore";
import { users, formatCOP, type UserDTO, type UpdateUserDTO } from "~/services/api";

export default function Cuenta() {
  const navigate = useNavigate();
  const { user, clearSession } = useAuthStore();
  const [profile, setProfile] = useState<UserDTO | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [form, setForm] = useState<UpdateUserDTO>({
    username: "",
    monthlySavingsGoal: "",
    profileImageUrl: "",
  });

  useEffect(() => {
    if (!user?.userId) return;
    users.getById(user.userId)
      .then((p) => {
        setProfile(p);
        setForm({
          username: p.username ?? "",
          monthlySavingsGoal: p.monthlySavingsGoal ?? "",
          profileImageUrl: p.profileImageUrl ?? "",
        });
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [user?.userId]);

  async function handleSave() {
    if (!user?.userId) return;
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const updated = await users.update(user.userId, form);
      setProfile(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleLogout() {
    clearSession();
    navigate("/login");
  }

  return (
    <DashboardLayout>
      <div className="max-w-lg mx-auto py-4">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
          <h1 className="text-2xl font-bold text-white">Mi cuenta</h1>
          <p className="text-sm text-gray-400 mt-0.5">Gestiona tu perfil y configuración</p>
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700 rounded-xl text-red-300 text-sm mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 bg-cyan-900/30 border border-cyan-700 rounded-xl text-cyan-300 text-sm mb-4">
            Cambios guardados correctamente.
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            {/* Profile card */}
            <div className="bg-secondary rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-5">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                  {profile?.profileImageUrl ? (
                    <img src={profile.profileImageUrl} alt="" className="w-14 h-14 rounded-full object-cover" />
                  ) : (
                    <User className="h-6 w-6 text-white" />
                  )}
                </div>
                <div>
                  <p className="text-white font-semibold">{profile?.username ?? "—"}</p>
                  <p className="text-sm text-gray-400">{profile?.email}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${
                    profile?.role === "ADMIN"
                      ? "bg-purple-500/20 text-purple-400"
                      : "bg-cyan-500/20 text-cyan-400"
                  }`}>
                    {profile?.role}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">Nombre de usuario</label>
                  <input
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    className="w-full bg-gray-800 text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-400 mb-1 block">URL foto de perfil</label>
                  <input
                    value={form.profileImageUrl}
                    onChange={(e) => setForm({ ...form, profileImageUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full bg-gray-800 text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Savings goal */}
            <div className="bg-secondary rounded-2xl p-5">
              <div className="flex items-center gap-2 mb-4">
                <Target className="h-4 w-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-white">Meta de ahorro mensual</h3>
              </div>
              <input
                type="number"
                value={form.monthlySavingsGoal}
                onChange={(e) => setForm({ ...form, monthlySavingsGoal: e.target.value })}
                placeholder="0"
                className="w-full bg-gray-800 text-white placeholder-gray-500 px-3 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm"
              />
              {profile?.monthlySavingsGoal && (
                <p className="text-xs text-gray-500 mt-2">
                  Meta actual: {formatCOP(profile.monthlySavingsGoal)}
                </p>
              )}
            </div>

            {/* Actions */}
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Guardar cambios
            </button>

            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-gray-700 text-gray-400 hover:text-white hover:border-gray-600 text-sm transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Cerrar sesión
            </button>
          </motion.div>
        )}
      </div>
    </DashboardLayout>
  );
}
