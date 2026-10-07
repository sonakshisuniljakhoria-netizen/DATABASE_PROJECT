// Define the backend tunnel URL provided by your friend
const API_BASE_URL = "https://st4q4v1d-3000.inc1.devtunnels.ms";

// Example of how to fetch camps from your backend view
export async function getCamps() {
  try {
    const response = await fetch(`${API_BASE_URL}/api/camps`);
    if (!response.ok) throw new Error("Failed to fetch camps");
    return await response.json();
  } catch (err) {
    console.error(err);
    return [];
  }
}

// Example of how to register a victim (matches your server.js POST route)
export async function createVictim(data) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/victims`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to create victim");
    return await response.json();
  } catch (err) {
    console.error(err);
    return { success: false, error: err.message };
  }
}

// Keep any mockup functions if needed, or replace them with real API calls using API_BASE_URL:
export const fetchStats = async () => {
  // If you have a stats endpoint, fetch it here, or keep your mockup if your backend doesn't have it yet
  return { success: true, stats: {} };
};
