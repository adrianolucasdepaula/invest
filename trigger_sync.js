const fs = require("fs");
const token = fs.readFileSync("token.txt", "utf8").trim();

async function triggerSync() {
  try {
    console.log("Triggering options liquidity sync...");
    const response = await fetch(
      "http://localhost:3101/api/v1/assets/sync-options-liquidity",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error("Sync failed:", response.status);
      const text = await response.text();
      console.error("Response:", text);
      process.exit(1);
    }

    const result = await response.json();
    console.log("Sync successful!");
    console.log("Total Updated:", result.totalUpdated);
    console.log("Assets with Options:", result.assetsWithOptions);

    if (result.assetsWithOptions && result.assetsWithOptions.length > 0) {
      console.log("✅ Scraper found assets with options.");
    } else {
      console.warn(
        "⚠️ Scraper returned NO assets with options. Check scraper logic or website."
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

triggerSync();
