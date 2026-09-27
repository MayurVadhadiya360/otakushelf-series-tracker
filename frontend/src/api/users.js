import client from "./client";

export async function updateTheme(theme_preference) {
  const { data } = await client.put("/api/users/me/theme", { theme_preference });
  return data;
}
