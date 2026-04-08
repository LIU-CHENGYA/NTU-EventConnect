import api from "./client";

// ---------- mappers: backend snake_case -> frontend camelCase ----------
function mapEvent(e) {
  if (!e) return e;
  const firstSession = (e.sessions && e.sessions[0]) || {};
  return {
    id: e.id,
    title: e.title,
    content: e.content || "",
    activityContent: e.content || "",
    category: e.category || "活動",
    image: e.image_url,
    organizer: e.organizer || "",
    organizerContact: e.organizer_contact || "",
    contactPhone: e.contact_phone || "",
    contactEmail: e.contact_email || "",
    registrationType: e.registration_type || "",
    registrationFee: e.registration_fee || "",
    targetAudience: e.target_audience || "",
    learningCategory: e.learning_category || "",
    // session-derived for backwards compat with existing UI
    date: firstSession.date || "",
    time: firstSession.time_range || "",
    location: firstSession.location || "",
    instructor: firstSession.instructor || "",
    capacity: firstSession.capacity ?? 0,
    remainingSlots: firstSession.remaining_slots ?? 0,
    registrationStart: firstSession.registration_start || "",
    registrationEnd: firstSession.registration_end || "",
    sessionName: firstSession.session_name || "",
    meal: firstSession.meal || "",
    sessions: e.sessions || [],
    rating: 0,
    reviewCount: 0,
  };
}

function mapPost(p) {
  if (!p) return null;

  // 定義一個內部的小工具，處理頭貼路徑
  const getAvatar = (userId, avatarPath) => {
    if (avatarPath) {
      // 如果已經是完整網址就直接用，否則加上後端位址
      return avatarPath.startsWith('http') ? avatarPath : `http://localhost:8000${avatarPath}`;
    }
    // 沒頭貼就用 Dicebear 備案
    return `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`;
  };

  return {
    id: p.id,
    userId: p.user_id,
    userName: p.user_name || `User #${p.user_id}`,
    userAvatar: getAvatar(p.user_id, p.user_avatar), // 使用處理後的頭貼
    eventId: p.event_id,
    rating: p.rating,
    content: p.content,
    images: p.images || [],
    visibility: p.visibility,
    createdAt: p.created_at,
    likeCount: p.like_count ?? 0,
    isLiked: p.is_liked ?? false,
    isBookmarked: p.is_bookmarked ?? false,
    comments: (p.comments || []).map((c) => ({
      ...c,
      userName: c.user_name || `User #${c.user_id}`,
      // 留言者的頭貼也一併處理
      userAvatar: getAvatar(c.user_id, c.user_avatar),
    })),
  };
}

// ---------- endpoints ----------
export const authApi = {
  register: (name, email, password) =>
    api.post("/api/auth/register", { name, email, password }).then((r) => r.data),
  login: (email, password) =>
    api.post("/api/auth/login", { email, password }).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
  googleLogin: (credential) =>
    api.post("/api/auth/google", { credential }).then((r) => r.data),
};

export const eventsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/events", { params });
    return { ...data, items: data.items.map(mapEvent) };
  },
  get: async (id) => {
    const { data } = await api.get(`/api/events/${id}`);
    return mapEvent(data);
  },
  categories: async () => {
    const { data } = await api.get("/api/events/categories");
    return data; // [{name, count}]
  },
};

export const postsApi = {
  list: async (params = {}) => {
    const { data } = await api.get("/api/posts", { params });
    return data.map(mapPost);
  },
  get: async (id) => {
    const { data } = await api.get(`/api/posts/${id}`);
    return mapPost(data);
  },
  create: (payload) => api.post("/api/posts", payload).then((r) => mapPost(r.data)),
  update: (id, payload) => api.patch(`/api/posts/${id}`, payload).then((r) => mapPost(r.data)),
  remove: (id) => api.delete(`/api/posts/${id}`),
  addComment: (postId, content) =>
    api.post(`/api/posts/${postId}/comments`, { content }).then((r) => r.data),
  like: (id) => api.post(`/api/posts/${id}/like`),
  unlike: (id) => api.delete(`/api/posts/${id}/like`),
  bookmark: (id) => api.post(`/api/posts/${id}/bookmark`),
  unbookmark: (id) => api.delete(`/api/posts/${id}/bookmark`),
};

export const bookmarksApi = {
  myEvents: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/events");
    return data.map(mapEvent);
  },
  myPosts: async () => {
    const { data } = await api.get("/api/users/me/bookmarks/posts");
    return data.map(mapPost);
  },
  bookmarkEvent: (id) => api.post(`/api/events/${id}/bookmark`),
  unbookmarkEvent: (id) => api.delete(`/api/events/${id}/bookmark`),
};

export const usersApi = {
  get: (id) => api.get(`/api/users/${id}`).then((r) => r.data),
  updateMe: (payload) => api.patch("/api/users/me", payload).then((r) => r.data),
  myDrafts: async () => {
    const { data } = await api.get("/api/users/me/drafts");
    return data.map(mapPost);
  },
  myRegistrations: () => api.get("/api/users/me/registrations").then((r) => r.data),
};

export const uploadsApi = {
  /**
   * 上傳圖片並回傳網址
   * @param {File} file 
   * @returns {Promise<{url: string}>}
   */
  upload: (file) => {
    const formData = new FormData();
    formData.append("file", file);
    return api.post("/api/uploads", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    }).then((r) => r.data);
  },
};

export { mapEvent, mapPost };
