import { useEffect, useState } from "react";
import axios from "axios";
import {
  FiEdit2, FiTrash2, FiPlus, FiX, FiCheck, FiEye, FiEyeOff,
  FiAlertCircle,
} from "react-icons/fi";

const API = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

// ─── axios helper ─────────────────────────────────────────────────────────────
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("token")}`,
});

// ─── Reusable Modal ───────────────────────────────────────────────────────────
function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-black text-gray-900 text-lg">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
          >
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
        <p className="text-gray-700 mb-6">{message}</p>
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
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Input helpers ────────────────────────────────────────────────────────────
const Field = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <input
      {...props}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

const TextArea = ({ label, ...props }) => (
  <div className="mb-4">
    <label className="block text-xs font-bold text-gray-600 mb-1">{label}</label>
    <textarea
      {...props}
      rows={4}
      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
    />
  </div>
);

const Toggle = ({ label, checked, onChange }) => (
  <div className="flex items-center gap-3 mb-4">
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full transition-colors ${
        checked ? "bg-blue-600" : "bg-gray-300"
      } relative`}
    >
      <span
        className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${
          checked ? "left-5" : "left-1"
        }`}
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
      className={`fixed top-5 right-5 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg text-white text-sm font-semibold
        ${toast.type === "error" ? "bg-red-600" : "bg-green-600"}`}
    >
      {toast.type === "error" ? (
        <FiAlertCircle size={15} />
      ) : (
        <FiCheck size={15} />
      )}
      {toast.msg}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// TESTIMONIALS TAB
// ══════════════════════════════════════════════════════════════════════════════
const TESTIMONIAL_BLANK = {
  name: "",
  role: "",
  text: "",
  rating: 5,
  avatar: "",
  isActive: true,
  order: 0,
};

function TestimonialsAdmin() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null); // null | "create" | "edit"
  const [form, setForm]       = useState(TESTIMONIAL_BLANK);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null); // id to delete
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/testimonials/admin/all`, {
        headers: getAuthHeader(),
      });
      if (data.success) setItems(data.data);
      else showToast(data.message || "Failed to load testimonials.", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(TESTIMONIAL_BLANK); setEditId(null); setModal("create"); };
  const openEdit   = (item) => { setForm({ ...item }); setEditId(item._id); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditId(null); };

  // ── Save (Create / Update) ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "create") {
        const { data } = await axios.post(`${API}/api/testimonials`, form, {
          headers: getAuthHeader(),
        });
        if (data.success) showToast("Testimonial created!");
        else throw new Error(data.message);
      } else {
        const { data } = await axios.put(
          `${API}/api/testimonials/${editId}`,
          form,
          { headers: getAuthHeader() }
        );
        if (data.success) showToast("Testimonial updated!");
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
      const { data } = await axios.delete(`${API}/api/testimonials/${id}`, {
        headers: getAuthHeader(),
      });
      if (data.success) showToast("Testimonial deleted!");
      else throw new Error(data.message);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  return (
    <div>
      <Toast toast={toast} />

      {confirm && (
        <ConfirmDialog
          message="Delete this testimonial? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Add Testimonial" : "Edit Testimonial"}
          onClose={closeModal}
        >
          <Field
            label="Customer Name *"
            value={form.name}
            onChange={set("name")}
            placeholder="e.g. Rahul Sharma"
          />
          <Field
            label="Role / Location"
            value={form.role}
            onChange={set("role")}
            placeholder="e.g. Verified Buyer, Dharwad"
          />
          <TextArea
            label="Review Text *"
            value={form.text}
            onChange={set("text")}
            placeholder="What did they say?"
          />
          <div className="mb-4">
            <label className="block text-xs font-bold text-gray-600 mb-1">
              Rating (1–5)
            </label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, rating: n }))}
                  className={`text-xl transition-transform hover:scale-110 ${
                    n <= form.rating ? "text-yellow-400" : "text-gray-300"
                  }`}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          <Field
            label="Avatar URL (optional)"
            value={form.avatar}
            onChange={set("avatar")}
            placeholder="https://..."
          />
          <Field
            label="Display Order"
            type="number"
            value={form.order}
            onChange={set("order")}
          />
          <Toggle
            label="Active (visible on site)"
            checked={form.isActive}
            onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          <div className="flex gap-3 mt-2">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? "Saving…" : <><FiCheck /> Save</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {items.length} testimonial{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Testimonial
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No testimonials yet. Add one!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Customer</th>
                <th className="px-4 py-3 text-left">Review</th>
                <th className="px-4 py-3 text-center">Rating</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Order</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-black text-xs flex-shrink-0">
                        {t.name?.[0] ?? "?"}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{t.name}</p>
                        <p className="text-xs text-gray-400">{t.role}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs">
                    <p className="line-clamp-2 italic text-xs">"{t.text}"</p>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-yellow-400">{"★".repeat(t.rating)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${t.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {t.isActive ? (
                        <FiEye className="text-[10px]" />
                      ) : (
                        <FiEyeOff className="text-[10px]" />
                      )}
                      {t.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-gray-500">
                    {t.order}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(t)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => setConfirm(t._id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// BLOG POSTS TAB
// ══════════════════════════════════════════════════════════════════════════════
const BLOG_BLANK = {
  title: "",
  excerpt: "",
  content: "",
  img: "",
  cat: "",
  date: "",
  link: "",
  isActive: true,
  order: 0,
};

function BlogAdmin() {
  const [items, setItems]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]     = useState(null);
  const [form, setForm]       = useState(BLOG_BLANK);
  const [editId, setEditId]   = useState(null);
  const [saving, setSaving]   = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [toast, setToast]     = useState(null);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Load ──────────────────────────────────────────────────────────────────
  const load = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${API}/api/blogs/admin/all`, {
        headers: getAuthHeader(),
      });
      if (data.success) setItems(data.data);
      else showToast(data.message || "Failed to load blog posts.", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setForm(BLOG_BLANK); setEditId(null); setModal("create"); };
  const openEdit   = (item) => { setForm({ ...item }); setEditId(item._id); setModal("edit"); };
  const closeModal = () => { setModal(null); setEditId(null); };

  // ── Save (Create / Update) ────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      if (modal === "create") {
        const { data } = await axios.post(`${API}/api/blogs`, form, {
          headers: getAuthHeader(),
        });
        if (data.success) showToast("Blog post created!");
        else throw new Error(data.message);
      } else {
        const { data } = await axios.put(
          `${API}/api/blogs/${editId}`,
          form,
          { headers: getAuthHeader() }
        );
        if (data.success) showToast("Blog post updated!");
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
      const { data } = await axios.delete(`${API}/api/blogs/${id}`, {
        headers: getAuthHeader(),
      });
      if (data.success) showToast("Blog post deleted!");
      else throw new Error(data.message);
      load();
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setConfirm(null);
    }
  };

  const set = (k) => (e) =>
    setForm((f) => ({ ...f, [k]: e.target ? e.target.value : e }));

  return (
    <div>
      <Toast toast={toast} />

      {confirm && (
        <ConfirmDialog
          message="Delete this blog post? This cannot be undone."
          onConfirm={() => handleDelete(confirm)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal && (
        <Modal
          title={modal === "create" ? "Add Blog Post" : "Edit Blog Post"}
          onClose={closeModal}
        >
          <Field
            label="Title *"
            value={form.title}
            onChange={set("title")}
            placeholder="e.g. How to use Arduino..."
          />
          <TextArea
            label="Excerpt *"
            value={form.excerpt}
            onChange={set("excerpt")}
            placeholder="Short description shown in card"
          />
          <Field
            label="Category *"
            value={form.cat}
            onChange={set("cat")}
            placeholder="e.g. Tutorial, News"
          />
          <Field
            label="Display Date *"
            value={form.date}
            onChange={set("date")}
            placeholder="e.g. Jan 12, 2025"
          />
          <Field
            label="Link / Slug *"
            value={form.link}
            onChange={set("link")}
            placeholder="/blog/arduino-tutorial"
          />
          <Field
            label="Image URL"
            value={form.img}
            onChange={set("img")}
            placeholder="https://..."
          />
          <Field
            label="Display Order"
            type="number"
            value={form.order}
            onChange={set("order")}
          />
          <Toggle
            label="Active (visible on site)"
            checked={form.isActive}
            onChange={(v) => setForm((f) => ({ ...f, isActive: v }))}
          />
          <div className="flex gap-3 mt-2">
            <button
              onClick={closeModal}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-semibold"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white hover:bg-blue-700 text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {saving ? "Saving…" : <><FiCheck /> Save</>}
            </button>
          </div>
        </Modal>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <p className="text-sm text-gray-500">
          {items.length} post{items.length !== 1 ? "s" : ""}
        </p>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          <FiPlus /> Add Blog Post
        </button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No blog posts yet. Add one!
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500 font-bold uppercase tracking-wide">
              <tr>
                <th className="px-4 py-3 text-left">Title</th>
                <th className="px-4 py-3 text-left">Category</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Link</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {items.map((post) => (
                <tr
                  key={post._id}
                  className="hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      {post.img && (
                        <img
                          src={post.img}
                          alt=""
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0 bg-gray-100"
                          onError={(e) => { e.target.style.display = "none"; }}
                        />
                      )}
                      <p className="font-semibold text-gray-900 line-clamp-1">
                        {post.title}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">
                      {post.cat}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{post.date}</td>
                  <td className="px-4 py-3 text-blue-600 text-xs truncate max-w-[120px]">
                    {post.link}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold
                        ${post.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                        }`}
                    >
                      {post.isActive ? (
                        <FiEye className="text-[10px]" />
                      ) : (
                        <FiEyeOff className="text-[10px]" />
                      )}
                      {post.isActive ? "Active" : "Hidden"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => openEdit(post)}
                        className="p-1.5 hover:bg-blue-50 text-blue-600 rounded-lg transition-colors"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        onClick={() => setConfirm(post._id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors"
                      >
                        <FiTrash2 />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN ADMIN PAGE
// ══════════════════════════════════════════════════════════════════════════════
export function TestimonialsAndBlogAdmin() {
  const [tab, setTab] = useState("testimonials");

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-gray-900 mb-6">
          Content Manager
        </h1>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 bg-white p-1 rounded-2xl border border-gray-100 w-fit">
          {[
            { key: "testimonials", label: "⭐ Testimonials" },
            { key: "blogs",        label: "📝 Blog Posts"  },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors
                ${tab === t.key
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-900"
                }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
          {tab === "testimonials" ? <TestimonialsAdmin /> : <BlogAdmin />}
        </div>
      </div>
    </div>
  );
}

export default TestimonialsAndBlogAdmin;