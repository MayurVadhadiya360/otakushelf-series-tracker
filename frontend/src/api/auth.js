import client from "./client";

export async function registerUser({ username, email, password }) {
  const { data } = await client.post("/api/auth/register", {
    username,
    email,
    password,
  });
  return data;
}

export async function loginUser({ username, password }) {
  // The backend expects OAuth2 form-encoded data, not JSON.
  const form = new URLSearchParams();
  form.append("username", username);
  form.append("password", password);

  const { data } = await client.post("/api/auth/login", form, {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  return data;
}

export async function fetchCurrentUser() {
  const { data } = await client.get("/api/auth/me");
  return data;
}
