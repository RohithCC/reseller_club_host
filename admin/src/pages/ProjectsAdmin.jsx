// src/pages/ProjectsAdmin.jsx

import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiEdit2, FiTrash2, FiPlus, FiX, FiCheck,
  FiEye, FiEyeOff, FiAlertCircle, FiExternalLink,
} from "react-icons/fi";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Modal ────────────────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-lg">{title}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-lg transition-colors">
            <FiX className="text-gray-500 text-xl" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-2xl text-center">
        <div className="text-3xl mb-3">🗑️</div>
        <p className="text-gray-700 font-semibold mb-1">Are you sure?</p>
        <p className="text-gray-400 text-sm mb-6">{message}</p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={onCancel}
            className="px-5 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-5 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition-colors text-sm font-semibold"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Field helpers ────────────────────────────────────────────────────────────
const Field = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <input
      {...props}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
    />
  </div>
);

const TextArea = ({ label, rows = 4, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <textarea
      {...props}
      rows={rows}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none transition-shadow"
    />
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-3 mb-4">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors relative ${checked ? "bg-blue-600" : "bg-gray-300"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${checked ? "left-5" : "left-1"}`}
      />
    </button>
    <span className="text-xs font-bold text-gray-600">{label}</span>
  </div>
);

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ toast }) {
  if (!toast) return null;
  return (
    <div
      className={`fixed top-5 right-5 z-[60] flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold ${
        toast.type === "error" ? "bg-red-600" : "bg-green-600"
      }`}
    >
      {toast.type === "error" ? <FiAlertCircle size={15} /> : <FiCheck size={15} />}
      {toast.msg}
    </div>
  );
}

// ─── Image Preview ────────────────────────────────────────────────────────────
function ImagePreview({ src }) {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk(false); }, [src]);
  if (!src) return null;
  return (
    <div className="mb-4">
      <label className="block text-xs font-bold text-gray-600 mb-1">Image Preview</label>
      <div className="w-full h-36 rounded-xl overflow-hidden bg-gray-100 border border-gray-200 flex items-center justify-center">
        <img
          src={src}
          alt="preview"
          className="w-full h-full object-cover"
          onLoad={() => setOk(true)}
          onError={() => setOk(false)}
          style={{ display: ok ? "block" : "none" }}
        />
        {!ok && (
          <span className="text-gray-400 text-xs">Paste a valid image URL above</span>
        )}
      </div>
    </div>
  );
}

// ─── Blank form ───────────────────────────────────────────────────────────────
const PROJECT_BLANK = {
  title:       "",
  description: "",
  img:         "",
  cat:         "",
  date:        "",
  link:        "",
  isActive:    true,
  order:       0,
};

// ══════════════════════════════════════════════════════════════════════════════
// PROJECTS ADMIN
// ══════════════════════════════════════════════════════════════════════════════
function ProjectsAdmin() {
  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(PROJECT_BLANK);
  const [editId,  setEditId]  = useState(null);
  const [saving,  setSaving]  = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast,   setToast]   = useState(null);
  const [search,  setSearch]  = useState("");

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/projects/admin/all`, {
        headers: getAuthHeader(),
      });
      if (data.success) setItems(Array.isArray(data.data) ? data.data : []);
      else showToast(data.message || "Failed to load.", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ── Modal helpers ─────────────────────────────────────────────────────────
  const openCreate = () => { setForm(PROJECT_BLANK); setEditId(null); setModal("create"); };
  const openEdit   = (item) => { setForm({ ...item }); setEditId(item._id); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditId(null); };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!form.title.trim())       return showToast("Title is required.", "error");
    if (!form.description.trim()) return showToast("Description is required.", "error");
    if (!form.cat.trim())         return showToast("Category is required.", "error");
    if (!form.date.trim())        return showToast("Date is required.", "error");

    setSaving(true);
    try {
      if (modal === "create") {
        const { data } = await axios.post(`${API}/api/projects`, form, {
          headers: getAuthHeader(),
        });
        if (data.success) showToast("Project created!");
        else throw new Error(data.message);
      } else {
        const { data } = await axios.put(
          `${API}/api/projects/${editId}`,
          form,
          { headers: getAuthHeader() }
        );
        if (data.success) showToast("Project updated!");
        else throw new Error(data.message);
      }
      closeModal();
      load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
  const handleDelete = async (id) => {
    try {
      const { data } = await axios.delete(`${API}/api/projects/${id}`, {
        headers: getAuthHeader(),
      });
      if (data.success) showToast("Project deleted!");
      else throw new Error(data.message);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  // ── Quick toggle active ───────────────────────────────────────────────────
  const toggleActive = async (item) => {
    try {
      const { data } = await axios.put(
        `${API}/api/projects/${item._id}`,
        { ...item, isActive: !item.isActive },
        { headers: getAuthHeader() }
      );
      if (data.success) {
        showToast(data.data.isActive ? "Project set Active" : "Project Hidden");
        load();
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    }
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  const filtered = items.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.cat?.toLowerCase().includes(search.toLowerCase())
  );

  const cats = [...new Set(items.map((p) => p.cat).filter(Boolean))];

// ✅ BULLETPROOF version — no JSX angle brackets at all
function LinkCell({ link }) {
  if (!link) {
    return <span className="text-gray-300 text-xs">—</span>;
  }
  const url = link.startsWith("http") ? link : `https://${link}`;
  return React.createElement(
    "a",
    {
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      className: "flex items-center gap-1 text-blue-600 text-xs hover:underline max-w-[110px] truncate",
    },
    React.createElement(FiExternalLink, { size: 10, className: "flex-shrink-0" }),
    link
  );
}

  return (
    <div>
      <Toast toast={toast} />

      {confirm && (
        <ConfirmDialog
          message="This project will be permanently deleted and removed from the site."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Add New Project" : "Edit Project"}
          onClose={closeModal}
        >
          <Field
            label="Title *"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. Line Following Robot"
          />
          <TextArea
            label="Description *"
            value={form.description}
            onChange={set("description")}
            placeholder="What was built, what components were used..."
            rows={4}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Category *"
              value={form.cat}
              onChange={set("cat")}
              placeholder="e.g. Robotics"
            />
            <Field
              label="Display Date *"
              value={form.date}
              onChange={set("date")}
              placeholder="e.g. Mar 2025"
            />
          </div>
          <Field
            label="Image URL"
            value={form.img}
            onChange={set("img")}
            placeholder="https://res.cloudinary.com/..."
          />
          <ImagePreview src={form.img} />
          <Field
            label="Project Link (optional)"
            value={form.link}
            onChange={set("link")}
            placeholder="/projects/line-follower  or  https://..."
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Display Order"
              type="number"
              value={form.order}
              onChange={set("order")}
            />
            <div className="flex flex-col justify-end mb-4">
              <Toggle
                label="Visible on site"
                checked={form.isActive}
                onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
              />
            </div>
          </div>
          <div className="flex gap-3 mt-2">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
            >
              {saving ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <FiCheck />
                  {modal === "create" ? "Create Project" : "Save Changes"}
                </>
              )}
            </button>
          </div>
        </Modal>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Total",      value: items.length,                            color: "#1a56db", bg: "#eff6ff" },
          { label: "Active",     value: items.filter((p) => p.isActive).length,  color: "#16a34a", bg: "#f0fdf4" },
          { label: "Hidden",     value: items.filter((p) => !p.isActive).length, color: "#9ca3af", bg: "#f9fafb" },
          { label: "Categories", value: cats.length,                             color: "#7c3aed", bg: "#f5f3ff" },
        ].map((s) => (
          <div
            key={s.label}
            className="rounded-xl p-4 flex flex-col"
            style={{ background: s.bg, border: `1px solid ${s.color}22` }}
          >
            <span className="text-2xl font-black" style={{ color: s.color }}>{s.value}</span>
            <span className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <input
          type="text"
          placeholder="Search by title or category..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors whitespace-nowrap"
        >
          <FiPlus /> Add Project
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border border-dashed border-gray-200">
          <div className="text-4xl mb-3">📂</div>
          <p className="text-gray-400 font-bold text-sm">
            {search ? `No results for "${search}"` : "No projects yet. Add one!"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Project</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Link</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((project) => (
                <tr key={project._id} className="hover:bg-gray-50 transition-colors">

                  {/* Title + thumbnail */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                        {project.img ? (
                          <img
                            src={project.img}
                            alt={project.title}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.style.display = "none"; }}
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">
                            🖼️
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 truncate max-w-[180px]">
                          {project.title}
                        </p>
                        <p className="text-xs text-gray-400 truncate max-w-[180px] mt-0.5">
                          {project.description}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Category */}
                  <td className="px-4 py-3">
                    <span
                      className="text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                      style={{ background: "#eff6ff", color: "#1a56db" }}
                    >
                      {project.cat}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                    {project.date}
                  </td>

                  {/* ✅ Link — uses isolated LinkCell component, no inline ternary */}
                  <td className="px-4 py-3">
                    <LinkCell link={project.link} />
                  </td>

                  {/* Status toggle */}
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => toggleActive(project)}
                      title="Click to toggle visibility"
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-colors cursor-pointer ${
                        project.isActive
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      }`}
                    >
                      {project.isActive
                        ? (<><FiEye size={10} /> Active</>)
                        : (<><FiEyeOff size={10} /> Hidden</>)
                      }
                    </button>
                  </td>

                  {/* Order */}
                  <td className="px-4 py-3 text-center text-gray-500 text-xs">
                    {project.order}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1.5">
                      <button
                        onClick={() => openEdit(project)}
                        title="Edit"
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <FiEdit2 size={15} />
                      </button>
                      <button
                        onClick={() => setConfirm(project._id)}
                        title="Delete"
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </td>

                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <p className="text-xs text-gray-400 mt-3 text-right font-medium">
          {filtered.length} of {items.length} project{items.length !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// PAGE WRAPPER
// ══════════════════════════════════════════════════════════════════════════════
export function ProjectsAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Projects Manager</h1>
            <p className="text-gray-400 text-sm mt-0.5">
              Manage portfolio projects shown on the public site
            </p>
          </div>
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "#eff6ff", color: "#1a56db", border: "1px solid #dbeafe" }}
          >
            /api/projects
          </span>
        </div>
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-gray-100 shadow-sm">
          <ProjectsAdmin />
        </div>
      </div>
    </div>
  );
}

export default ProjectsAdminPage;