import { DashboardLayout } from "~/components/templates";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2, Upload, FileText, Trash2, AlertTriangle, CheckCircle2, Clock,
  X, FileCheck, FileX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { documents, type UserDocumentDTO } from "~/services/api";

const MAX_BYTES = 15 * 1024 * 1024;

export default function Documentos() {
  const [list, setList] = useState<UserDocumentDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserDocumentDTO | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function reload() {
    setLoading(true);
    documents.list()
      .then(setList)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }
  useEffect(reload, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setError("El archivo supera 15 MB.");
      return;
    }
    const lower = file.name.toLowerCase();
    if (!lower.endsWith(".pdf") && !lower.endsWith(".txt") && !lower.endsWith(".md")) {
      setError("Solo PDF, TXT o MD.");
      return;
    }
    setError(null);
    setUploading(true);
    try {
      const created = await documents.upload(file);
      setList((prev) => [created, ...prev]);
    } catch (e: any) {
      setError(e.message ?? "Falló la subida.");
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await documents.remove(deleteTarget.id);
      setList((prev) => prev.filter((d) => d.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch (e: any) {
      setError(e.message ?? "No se pudo borrar.");
    }
  }

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto py-2 space-y-5">
        <motion.div
          initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4 flex-wrap"
        >
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <FileText className="h-6 w-6 text-cyan-400" /> Documentos
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Subí PDFs y archivos de texto. FinBot los puede leer y responder preguntas sobre su contenido.
            </p>
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploading ? "Procesando…" : "Subir documento"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.txt,.md,application/pdf,text/plain,text/markdown"
            className="hidden"
            onChange={handleFile}
          />
        </motion.div>

        {error && (
          <div className="p-3 bg-red-900/30 border border-red-700/50 rounded-xl text-red-300 text-sm flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <span className="flex-1">{error}</span>
            <button onClick={() => setError(null)} className="text-red-300 hover:text-white">
              <X className="h-3 w-3" />
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center pt-16">
            <Loader2 className="h-6 w-6 text-gray-500 animate-spin" />
          </div>
        ) : list.length === 0 ? (
          <div className="text-center py-16 bg-secondary rounded-2xl border border-white/[0.04]">
            <FileText className="h-12 w-12 text-gray-700 mx-auto mb-3" />
            <p className="text-sm text-gray-300 font-medium">Aún no subiste documentos</p>
            <p className="text-xs text-gray-500 mt-1 mb-5">
              Subí un extracto bancario, factura, contrato o cualquier PDF que quieras consultar con FinBot.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500 text-white text-sm font-semibold rounded-lg hover:bg-cyan-600 transition-colors"
            >
              <Upload className="h-4 w-4" /> Subir mi primer documento
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {list.map((d) => (
              <DocumentRow key={d.id} doc={d} onDelete={() => setDeleteTarget(d)} />
            ))}
          </div>
        )}

        <div className="bg-secondary rounded-xl p-4 border border-white/[0.04] text-xs text-gray-500 space-y-1">
          <p><strong className="text-gray-300">Cómo funciona:</strong></p>
          <p>• Tu archivo se sube a Wasabi y se indexa en tu contexto privado.</p>
          <p>• El texto se divide en fragmentos y se vectoriza con Ollama (local).</p>
          <p>• FinBot puede invocar la herramienta <code className="text-cyan-400">searchUserDocuments</code> para buscar contenido relevante cuando le hagas preguntas.</p>
          <p>• Los archivos son privados — solo tu sesión los puede leer.</p>
        </div>
      </div>

      <DeleteModal
        target={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </DashboardLayout>
  );
}

function DocumentRow({ doc, onDelete }: { doc: UserDocumentDTO; onDelete: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
      className="bg-secondary rounded-xl border border-white/[0.04] p-4 flex items-center gap-4"
    >
      <StatusIcon status={doc.status} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-white font-semibold truncate">{doc.name}</p>
          <StatusBadge status={doc.status} />
        </div>
        <div className="text-[11px] text-gray-500 flex items-center gap-3 mt-0.5">
          <span>{formatSize(doc.sizeBytes)}</span>
          {doc.chunkCount != null && <span>{doc.chunkCount} fragmentos</span>}
          <span>{formatDate(doc.createdAt)}</span>
        </div>
        {doc.status === "FAILED" && doc.errorMessage && (
          <p className="text-[11px] text-rose-400 mt-1 truncate">{doc.errorMessage}</p>
        )}
      </div>
      <button
        onClick={onDelete}
        title="Eliminar"
        className="p-2 text-gray-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </motion.div>
  );
}

function StatusIcon({ status }: { status: UserDocumentDTO["status"] }) {
  const cls = "h-9 w-9 rounded-xl flex items-center justify-center flex-shrink-0";
  if (status === "READY") {
    return <div className={`${cls} bg-emerald-500/15 text-emerald-300`}><FileCheck className="h-4 w-4" /></div>;
  }
  if (status === "FAILED") {
    return <div className={`${cls} bg-rose-500/15 text-rose-300`}><FileX className="h-4 w-4" /></div>;
  }
  return <div className={`${cls} bg-amber-500/15 text-amber-300`}><Loader2 className="h-4 w-4 animate-spin" /></div>;
}

function StatusBadge({ status }: { status: UserDocumentDTO["status"] }) {
  const map = {
    READY:      { text: "Indexado",   cls: "bg-emerald-500/15 text-emerald-300", Icon: CheckCircle2 },
    PROCESSING: { text: "Procesando", cls: "bg-amber-500/15 text-amber-300",     Icon: Clock },
    FAILED:     { text: "Falló",      cls: "bg-rose-500/15 text-rose-300",       Icon: AlertTriangle },
  } as const;
  const { text, cls, Icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded ${cls}`}>
      <Icon className="h-3 w-3" /> {text}
    </span>
  );
}

function DeleteModal({ target, onClose, onConfirm }: {
  target: UserDocumentDTO | null; onClose: () => void; onConfirm: () => void;
}) {
  return (
    <AnimatePresence>
      {target && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#141418] border border-rose-500/30 rounded-2xl p-6 w-full max-w-sm"
          >
            <div className="flex items-center gap-2 text-rose-400 mb-3">
              <AlertTriangle className="h-5 w-5" />
              <h3 className="text-white font-semibold">Eliminar documento</h3>
            </div>
            <p className="text-sm text-gray-400">
              Se borra <span className="text-white font-semibold">{target.name}</span> de
              tu contexto privado y del storage. FinBot ya no podrá consultarlo.
            </p>
            <div className="flex items-center justify-end gap-2 mt-5">
              <button onClick={onClose} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Eliminar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function formatSize(bytes: number | null): string {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-CO", { day: "numeric", month: "short", year: "numeric" });
}
