// src/pages/Profile.jsx  —  Route: /profile
//
// ✅ Avatar upload flow:
//   1. User clicks camera icon → file picker opens
//   2. File is read as base64 → shown as preview instantly
//   3. On Save → base64 sent to POST /api/user/update-profile
//   4. Backend uploads to Cloudinary → saves secure_url to MongoDB
//   5. authSlice patches state with returned Cloudinary URL
//
import { useEffect, useState, useRef }  from "react";
import { Link, useNavigate }            from "react-router-dom";
import { useDispatch, useSelector }     from "react-redux";
import {
  FiUser, FiMail, FiPhone, FiEdit2, FiCheck,
  FiX, FiAlertCircle, FiCalendar, FiShield,
  FiStar, FiPackage, FiChevronRight, FiCamera,
  FiRefreshCw, FiLogOut, FiMapPin,
} from "react-icons/fi";
import {
  fetchUserProfile,
  updateUserProfile,
  clearAuthMessages,
  logoutUser,
  selectUserProfile,
  selectProfileLoading,
  selectProfileError,
  selectUpdating,
  selectUpdateError,
  selectUpdateSuccess,
  selectIsLoggedIn,
} from "../app/authSlice";

// ── Helpers ───────────────────────────────────────────────────────────────────
const fmtDate  = (ms) => ms
  ? new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })
  : "—";
const initials = (name) =>
  name ? name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) : "?";

const AVATAR_COLORS = [
  "from-violet-500 to-purple-600",
  "from-blue-500 to-cyan-600",
  "from-emerald-500 to-teal-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
];
const avatarColor = (name) =>
  AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];

// ── StatCard ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3.5">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color}`}>
        <Icon size={16} className="text-white" />
      </div>
      <div>
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{label}</p>
        <p className="text-sm font-black text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// ── EditableField ─────────────────────────────────────────────────────────────
function EditableField({ label, icon: Icon, value, editing, children }) {
  return (
    <div className="flex items-start gap-3 py-3.5 border-b border-gray-50 last:border-0">
      <div className="w-8 h-8 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Icon size={14} className="text-gray-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
        {editing
          ? children
          : <p className="text-sm font-bold text-gray-800 truncate">
              {value || <span className="text-gray-300 italic">Not set</span>}
            </p>
        }
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function Profile() {
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  // ✅ selectToken removed — thunks read token from getState().auth.token internally
  const isLoggedIn = useSelector(selectIsLoggedIn);
  const user       = useSelector(selectUserProfile);
  const loading    = useSelector(selectProfileLoading);
  const error      = useSelector(selectProfileError);
  const updating   = useSelector(selectUpdating);
  const updateErr  = useSelector(selectUpdateError);
  const updateOk   = useSelector(selectUpdateSuccess);

  const [editing,       setEditing]       = useState(false);
  const [form,          setForm]          = useState({ name: "", phone: "", avatar: "" });
  const [avatarPrev,    setAvatarPrev]    = useState("");
  // true while FileReader is converting file to base64
  const [fileLoading,   setFileLoading]   = useState(false);
  const fileRef = useRef();

  // Auth guard
  useEffect(() => {
    if (!isLoggedIn) navigate("/login", { state: { from: "/profile" } });
  }, [isLoggedIn, navigate]);

  // Fetch profile on mount
  useEffect(() => {
    if (isLoggedIn) dispatch(fetchUserProfile());
  }, [isLoggedIn, dispatch]);

  // Seed form when user data arrives
  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", phone: user.phone || "", avatar: user.avatar || "" });
      setAvatarPrev(user.avatar || "");
    }
  }, [user]);

  // Auto-dismiss success + exit edit mode
  useEffect(() => {
    if (updateOk) {
      setEditing(false);
      const t = setTimeout(() => dispatch(clearAuthMessages()), 3000);
      return () => clearTimeout(t);
    }
  }, [updateOk, dispatch]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleEdit = () => {
    dispatch(clearAuthMessages());
    setEditing(true);
  };

  const handleCancel = () => {
    setEditing(false);
    setForm({ name: user?.name || "", phone: user?.phone || "", avatar: user?.avatar || "" });
    setAvatarPrev(user?.avatar || "");
    dispatch(clearAuthMessages());
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    // form.avatar is either:
    //   • base64 string  → backend uploads to Cloudinary
    //   • https:// URL   → backend stores directly
    //   • ""             → backend skips avatar update
    dispatch(updateUserProfile({
      name:   form.name.trim(),
      phone:  form.phone.trim(),
      avatar: form.avatar,
    }));
  };

  const handleAvatarUrl = (url) => {
    setForm((f) => ({ ...f, avatar: url }));
    setAvatarPrev(url);
  };

  // File picker → read as base64 → preview immediately
  // Base64 is sent to backend on Save, then uploaded to Cloudinary server-side
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate: images only, max 5MB
    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be smaller than 5MB.");
      return;
    }

    setFileLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target.result;   // "data:image/jpeg;base64,..."
      setAvatarPrev(base64);
      setForm((f) => ({ ...f, avatar: base64 }));
      setFileLoading(false);
    };
    reader.onerror = () => {
      setFileLoading(false);
      alert("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
    // Reset input so same file can be re-selected
    e.target.value = "";
  };

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate("/login");
  };

  if (!isLoggedIn) return null;

  // Loading
  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-gray-200 border-t-violet-500 rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-500 font-medium">Loading profile…</p>
      </div>
    </div>
  );

  // Error
  if (error) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-sm p-10 max-w-sm w-full text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <FiAlertCircle className="text-red-500" size={28} />
        </div>
        <h2 className="text-lg font-black text-gray-900 mb-2">Couldn't load profile</h2>
        <p className="text-sm text-gray-500 mb-6">{error}</p>
        <button onClick={() => dispatch(fetchUserProfile())}
          className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-6 py-2.5 rounded-full font-bold text-sm transition-colors">
          <FiRefreshCw size={14} /> Retry
        </button>
      </div>
    </div>
  );

  if (!user) return null;

  const color = avatarColor(user.name);
  // Show base64 preview while editing, real URL when viewing
  const avatarSrc = editing ? avatarPrev : user.avatar;

  return (
    <div className="min-h-screen bg-gray-50">

      {/* Breadcrumb */}
      <div className="bg-white border-b border-gray-100 px-4 py-3">
        <div className="max-w-[900px] mx-auto flex items-center gap-1.5 text-sm text-gray-400">
          <Link to="/" className="hover:text-violet-600 transition-colors">Home</Link>
          <FiChevronRight size={12} />
          <span className="text-gray-700 font-semibold">My Profile</span>
        </div>
      </div>

      <div className="max-w-[900px] mx-auto px-4 py-8 space-y-5">

        {/* ── Hero card ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className={`h-24 bg-gradient-to-r ${color} relative`}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 1px, transparent 1px)", backgroundSize: "28px 28px" }} />
          </div>

          <div className="px-6 pb-6">
            <div className="flex items-end justify-between -mt-10 mb-4">

              {/* Avatar */}
              <div className="relative">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.name}
                    className="w-20 h-20 rounded-2xl border-4 border-white shadow-lg object-cover"
                    onError={(e) => { e.target.style.display = "none"; }} />
                ) : (
                  <div className={`w-20 h-20 rounded-2xl border-4 border-white shadow-lg bg-gradient-to-br ${color} flex items-center justify-center`}>
                    <span className="text-white text-2xl font-black">{initials(user.name)}</span>
                  </div>
                )}

                {/* Camera button — only in edit mode */}
                {editing && (
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={fileLoading}
                    className="absolute -bottom-1.5 -right-1.5 w-7 h-7 bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 rounded-xl flex items-center justify-center shadow-md transition-colors"
                    title="Upload photo"
                  >
                    {fileLoading
                      ? <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <FiCamera size={12} className="text-white" />
                    }
                  </button>
                )}
                {/* Hidden file input — accepts images up to 5MB */}
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {/* Action buttons */}
              <div className="flex items-center gap-2 pb-1">
                {!editing ? (
                  <button onClick={handleEdit}
                    className="flex items-center gap-1.5 text-xs font-black text-violet-600 hover:text-violet-800 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-3 py-2 rounded-xl transition-all">
                    <FiEdit2 size={12} /> Edit Profile
                  </button>
                ) : (
                  <>
                    <button onClick={handleCancel} disabled={updating || fileLoading}
                      className="flex items-center gap-1.5 text-xs font-black text-gray-500 bg-gray-100 hover:bg-gray-200 px-3 py-2 rounded-xl transition-all disabled:opacity-50">
                      <FiX size={12} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={updating || fileLoading || !form.name.trim()}
                      className="flex items-center gap-1.5 text-xs font-black text-white bg-violet-600 hover:bg-violet-700 disabled:bg-violet-300 px-3 py-2 rounded-xl transition-all"
                      title={fileLoading ? "Wait for image to load" : ""}
                    >
                      {updating
                        ? <><span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                            {/* Show "Uploading…" if avatar is base64 (Cloudinary upload in progress) */}
                            {form.avatar?.startsWith("data:") ? "Uploading…" : "Saving…"}
                          </>
                        : <><FiCheck size={12} /> Save Changes</>
                      }
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* View mode */}
            {!editing ? (
              <>
                <h1 className="text-2xl font-black text-gray-900">{user.name}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
                <div className="flex items-center gap-2 mt-2 flex-wrap">
                  {user.isVerified
                    ? <span className="text-[10px] font-black bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiShield size={9} /> Verified
                      </span>
                    : <span className="text-[10px] font-black bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <FiAlertCircle size={9} /> Unverified
                      </span>
                  }
                  {user.isBlocked && (
                    <span className="text-[10px] font-black bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Suspended</span>
                  )}
                  <span className="text-[10px] text-gray-400 flex items-center gap-1">
                    <FiCalendar size={9} /> Member since {fmtDate(user.date)}
                  </span>
                </div>
              </>
            ) : (
              /* Edit mode */
              <div className="space-y-3">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    Display Name *
                  </label>
                  <input type="text" value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Your full name"
                    className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-3 py-2.5 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
                    Avatar URL{" "}
                    <span className="normal-case font-semibold text-gray-300">
                      — or tap camera icon to upload a photo
                    </span>
                  </label>
                  <input type="url" value={form.avatar.startsWith("data:") ? "" : form.avatar}
                    onChange={(e) => handleAvatarUrl(e.target.value)}
                    placeholder="https://…"
                    className="w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-3 py-2.5 outline-none transition-all" />
                  {/* Show filename hint when a file has been picked */}
                  {form.avatar.startsWith("data:") && (
                    <p className="text-[10px] text-violet-600 font-semibold mt-1 flex items-center gap-1">
                      <FiCamera size={10} /> Photo selected — will upload to Cloudinary on save
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Toasts */}
        {updateOk && (
          <div className="bg-green-50 border border-green-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <FiCheck className="text-green-600 flex-shrink-0" size={16} />
            <p className="text-sm font-bold text-green-800">Profile updated successfully!</p>
          </div>
        )}
        {updateErr && (
          <div className="bg-red-50 border border-red-200 rounded-2xl px-4 py-3 flex items-center gap-3">
            <FiAlertCircle className="text-red-500 flex-shrink-0" size={16} />
            <p className="text-sm font-bold text-red-700">{updateErr}</p>
          </div>
        )}

        {/* Stats 
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <StatCard icon={FiStar}    label="Loyalty Points" value={user.loyaltyPoints ?? 0}        color="bg-gradient-to-br from-amber-400 to-orange-500" />
          <StatCard icon={FiPackage} label="Wallet Balance"  value={`₹${user.walletBalance ?? 0}`} color="bg-gradient-to-br from-emerald-400 to-teal-500" />
          <StatCard icon={FiMapPin}  label="Addresses"       value={user.addresses?.length ?? 0}   color="bg-gradient-to-br from-violet-400 to-purple-600" />
        </div> */}

        {/* Personal info */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2.5 px-5 py-3.5 border-b border-gray-100 bg-gray-50">
            <FiUser className="text-violet-500" size={15} />
            <h3 className="font-black text-gray-800 text-sm">Personal Information</h3>
          </div>
          <div className="px-5 py-1">
            <EditableField label="Email Address" icon={FiMail}     value={user.email}         editing={false} />
            <EditableField label="Phone Number"  icon={FiPhone}    value={user.phone}         editing={editing}>
              <input type="tel" value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+91 00000 00000"
                className="w-full text-sm font-bold text-gray-900 bg-gray-50 border border-gray-200 focus:border-violet-400 focus:ring-2 focus:ring-violet-100 rounded-xl px-3 py-2 outline-none transition-all" />
            </EditableField>
            <EditableField label="Account ID"    icon={FiShield}   value={user._id}           editing={false}>
              <p className="text-xs font-mono text-gray-500 truncate">{user._id}</p>
            </EditableField>
            <EditableField label="Member Since"  icon={FiCalendar} value={fmtDate(user.date)} editing={false} />
          </div>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link to="/orders"
            className="flex items-center justify-between bg-white border border-gray-100 hover:border-violet-200 hover:bg-violet-50 rounded-2xl px-5 py-4 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-violet-50 group-hover:bg-violet-100 rounded-xl flex items-center justify-center transition-colors">
                <FiPackage className="text-violet-500" size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 group-hover:text-violet-800">My Orders</p>
                <p className="text-[10px] text-gray-400">Track &amp; manage orders</p>
              </div>
            </div>
            <FiChevronRight className="text-gray-300 group-hover:text-violet-400" size={15} />
          </Link>
          <Link to="/wishlist"
            className="flex items-center justify-between bg-white border border-gray-100 hover:border-rose-200 hover:bg-rose-50 rounded-2xl px-5 py-4 transition-all group shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-rose-50 group-hover:bg-rose-100 rounded-xl flex items-center justify-center transition-colors">
                <FiStar className="text-rose-500" size={16} />
              </div>
              <div>
                <p className="text-sm font-black text-gray-800 group-hover:text-rose-800">Wishlist</p>
                <p className="text-[10px] text-gray-400">{user.wishlist?.length ?? 0} saved items</p>
              </div>
            </div>
            <FiChevronRight className="text-gray-300 group-hover:text-rose-400" size={15} />
          </Link>
        </div>

        {/* Sign out */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm font-black text-gray-700">Sign Out</p>
            <p className="text-[10px] text-gray-400">Log out of your account on this device</p>
          </div>
          <button onClick={handleLogout}
            className="flex items-center gap-1.5 text-xs font-black text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-100 px-3 py-2 rounded-xl transition-all">
            <FiLogOut size={12} /> Log Out
          </button>
        </div>

      </div>
    </div>
  );
}
