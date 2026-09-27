import client from "./client";

export async function fetchGenres() {
  const { data } = await client.get("/api/genres");
  return data;
}

export async function createGenre({ name, color }) {
  const { data } = await client.post("/api/genres", { name, color });
  return data;
}

export async function updateGenre(id, { name, color }) {
  const { data } = await client.put(`/api/genres/${id}`, { name, color });
  return data;
}

export async function deleteGenre(id) {
  await client.delete(`/api/genres/${id}`);
}
