const baseURL = process.env.VUE_APP_API_URL || "http://localhost:5000/api";

function getAuthToken() {
  return localStorage.getItem("auth_token");
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const response = await fetch(`${baseURL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    ...options,
  });

  let data = null;

  try {
    data = await response.json();
  } catch (error) {
    data = null;
  }

  if (!response.ok) {
    const requestError = new Error(data?.message || "Request failed.");
    requestError.response = { data };
    throw requestError;
  }

  return { data };
}

const API = {
  get(path) {
    return request(path, { method: "GET" });
  },
  post(path, payload) {
    return request(path, {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },
  put(path, payload) {
    return request(path, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
  },
  delete(path) {
    return request(path, { method: "DELETE" });
  },
};

export default API;
