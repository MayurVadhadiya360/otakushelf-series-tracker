import client from "./client";

export async function fetchSeries({ seriesType, statusFilter, genreId, search, sort } = {}) {
  const params = {};
  if (seriesType) params.series_type = seriesType;
  if (statusFilter) params.status_filter = statusFilter;
  if (genreId) params.genre_id = genreId;
  if (search) params.search = search;
  if (sort) params.sort = sort;

  const { data } = await client.get("/api/series", { params });
  return data;
}

export async function fetchStats() {
  const { data } = await client.get("/api/series/stats");
  return data;
}

export async function createSeries(payload) {
  const { data } = await client.post("/api/series", payload);
  return data;
}

export async function updateSeries(id, payload) {
  const { data } = await client.put(`/api/series/${id}`, payload);
  return data;
}

export async function deleteSeries(id) {
  await client.delete(`/api/series/${id}`);
}
