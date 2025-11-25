const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkOTBjNTk5ZC02MmJmLTQxNmQtYTBiNC1iYzI3NTYxZmQ2ZmEiLCJlbWFpbCI6ImFkbWluQGludmVzdC5jb20iLCJpYXQiOjE3NjQwMzM5NzksImV4cCI6MTc2NDYzODc3OX0.lbvd1QU0wH3yj_cVdNuORjdJmFTOgStoI-Rr3mW7y0s";

async function verifyAssets() {
  try {
    const response = await fetch("http://localhost:3101/api/v1/assets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Fetch failed:", response.status);
      process.exit(1);
    }

    const assets = await response.json();
    console.log(`Fetched ${assets.length} assets.`);

    if (assets.length > 0) {
      const firstAsset = assets[0];
      console.log("First asset sample:", JSON.stringify(firstAsset, null, 2));

      if ("hasOptions" in firstAsset) {
        console.log("✅ hasOptions field is present.");
      } else {
        console.error("❌ hasOptions field is MISSING.");
      }
    } else {
      console.warn("No assets found.");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

verifyAssets();
