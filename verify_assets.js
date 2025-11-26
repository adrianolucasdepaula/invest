const fs = require("fs");

// Check if token.txt exists
if (!fs.existsSync("token.txt")) {
  console.error(
    "Error: token.txt not found. Please run 'node login.js' first."
  );
  process.exit(1);
}

const token = fs.readFileSync("token.txt", "utf8").trim();

async function verifyAssets() {
  try {
    console.log("Fetching assets...");
    const response = await fetch("http://localhost:3101/api/v1/assets", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      console.error("Fetch failed:", response.status);
      if (response.status === 401) {
        console.error("Token might be expired. Run 'node login.js' again.");
      }
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
