// client/src/hooks/useSubscriptionFlow.js
export async function getPlans() {
  const base = import.meta.env.VITE_API_BASE;
  if (!base) throw new Error("VITE_API_BASE is missing from your build");

  const url = `${base}/api/plans`;
  console.log("Fetching plans from:", url);

  const res = await fetch(url); // no auth header needed; server handles OAuth
  const data = await res.json();

  if (!res.ok) throw new Error(data.error || "Failed to fetch plans");
  return data; // expect { data: [...] }
}
