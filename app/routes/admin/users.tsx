import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus, Trash2, ToggleLeft, ToggleRight, Mail, Loader2,
  ChevronLeft, ChevronRight, Search, X, ShieldCheck,
} from "lucide-react";
import { admin, type UserDTO } from "~/services/api";
import { DashboardLayout } from "~/components/templates/DashboardLayout";

export function meta() {
  return [{ title: "Usuarios · FINZ Admin" }];
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserDTO[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalElements, setTotalElements] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Action loading
  const [actionId, setActionId] = useState<string | null>(null);

  const fetchUsers = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const data = await admin.listUsers(p, 10);
      setUsers(data.content);
      setTotalPages(data.totalPages);
      setTotalElements(data.totalElements);
    } catch {
      // keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsers(page);
  }, [page]);

  const filtered = search.trim()
    ? users.filter(
        (u) =>
          u.email.toLowerCase().includes(search.toLowerCase()) ||
          (u.username ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : users;

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    setInviteError(null);
    setInviting(true);
    try {
      await admin.inviteUser(inviteEmail);
      setInviteSuccess(true);
      setInviteEmail("");
      fetchUsers(page);
    } catch (err: any) {
      setInviteError(err.message ?? "Error al enviar invitación");
    } finally {
      setInviting(false);
    }
  }

  async function handleToggle(id: string) {
    setActionId(id);
    try {
      const updated = await admin.toggleActive(id);
      setUsers((prev) => prev.map((u) => (u.id === id ? updated : u)));
    } finally {
      setActionId(null);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este usuario? Esta acción no se puede deshacer.")) return;
    setActionId(id);
    try {
      await admin.deleteUser(id);
      fetchUsers(page);
    } finally {
      setActionId(null);
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-white text-2xl font-bold">Usuarios</h1>
            <p className="text-gray-400 text-sm mt-0.5">{totalElements} usuarios registrados</p>
          </div>
          <button
            onClick={() => { setShowInvite(true); setInviteSuccess(false); setInviteError(null); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <UserPlus className="h-4 w-4" />
            Invitar usuario
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre…"
            className="w-full bg-secondary text-white pl-10 pr-4 py-2.5 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-secondary rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-6 w-6 text-cyan-400 animate-spin" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500 text-sm">
              No se encontraron usuarios.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-700">
                  <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium">Usuario</th>
                  <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium">Rol</th>
                  <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium">Estado</th>
                  <th className="text-left px-5 py-3.5 text-xs text-gray-400 font-medium">Registrado</th>
                  <th className="text-right px-5 py-3.5 text-xs text-gray-400 font-medium">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((user) => (
                  <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/30 transition-colors">
                    {/* User info */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gray-700 overflow-hidden flex-shrink-0">
                          {user.profileImageUrl ? (
                            <img src={user.profileImageUrl} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <span className="text-gray-300 text-sm font-medium">
                                {(user.username ?? user.email)[0].toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium leading-tight">
                            {user.username ?? <span className="text-gray-500 italic">Sin configurar</span>}
                          </p>
                          <p className="text-gray-400 text-xs">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Role */}
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                          user.role === "ADMIN"
                            ? "bg-purple-900/40 text-purple-300"
                            : "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {user.role === "ADMIN" && <ShieldCheck className="h-3 w-3" />}
                        {user.role}
                      </span>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.active ? "bg-green-400" : "bg-gray-500"
                          }`}
                        />
                        <span
                          className={`text-xs font-medium ${
                            user.active ? "text-green-400" : "text-gray-500"
                          }`}
                        >
                          {user.active ? "Activo" : "Inactivo"}
                        </span>
                        {!user.emailVerified && (
                          <span className="text-xs text-yellow-500 bg-yellow-900/30 px-1.5 py-0.5 rounded-full">
                            Pendiente
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {new Date(user.createdAt).toLocaleDateString("es-CO", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleToggle(user.id)}
                          disabled={actionId === user.id}
                          title={user.active ? "Desactivar" : "Activar"}
                          className="p-1.5 rounded-lg hover:bg-gray-700 transition-colors text-gray-400 hover:text-white disabled:opacity-40"
                        >
                          {actionId === user.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : user.active ? (
                            <ToggleRight className="h-4 w-4 text-cyan-400" />
                          ) : (
                            <ToggleLeft className="h-4 w-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          disabled={actionId === user.id}
                          title="Eliminar"
                          className="p-1.5 rounded-lg hover:bg-red-900/30 transition-colors text-gray-400 hover:text-red-400 disabled:opacity-40"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between">
            <p className="text-gray-400 text-sm">
              Página {page + 1} de {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-secondary border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-secondary border border-gray-700 text-gray-400 hover:text-white disabled:opacity-30 transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <AnimatePresence>
        {showInvite && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"
            onClick={(e) => e.target === e.currentTarget && setShowInvite(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              className="bg-secondary rounded-2xl p-6 w-full max-w-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-white font-semibold text-lg">Invitar usuario</h2>
                <button
                  onClick={() => setShowInvite(false)}
                  className="p-1.5 rounded-lg hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-gray-400 text-sm mb-5">
                El usuario recibirá un correo para activar su cuenta y configurar su contraseña.
              </p>

              {inviteSuccess ? (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex flex-col items-center gap-3 py-4"
                >
                  <div className="w-12 h-12 rounded-full bg-green-900/40 flex items-center justify-center">
                    <Mail className="h-6 w-6 text-green-400" />
                  </div>
                  <p className="text-white font-medium">¡Invitación enviada!</p>
                  <p className="text-gray-400 text-sm text-center">
                    El correo de activación fue enviado exitosamente.
                  </p>
                  <button
                    onClick={() => { setInviteSuccess(false); setShowInvite(false); }}
                    className="mt-2 text-cyan-400 hover:text-cyan-300 text-sm transition-colors"
                  >
                    Cerrar
                  </button>
                </motion.div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  <div>
                    <label className="block text-sm text-gray-400 mb-1.5">
                      Correo electrónico
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                      <input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="usuario@empresa.com"
                        required
                        className="w-full bg-gray-800 text-white pl-10 pr-4 py-3 rounded-xl border border-gray-700 focus:outline-none focus:border-cyan-500 text-sm placeholder-gray-600 transition-colors"
                      />
                    </div>
                  </div>

                  {inviteError && (
                    <p className="text-sm text-red-400 bg-red-900/20 border border-red-800 rounded-lg px-3 py-2">
                      {inviteError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={inviting}
                    className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity flex items-center justify-center gap-2"
                  >
                    {inviting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Enviar invitación"}
                  </button>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
}
