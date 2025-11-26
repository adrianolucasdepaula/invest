const fs = require("fs");

async function login() {
  try {
    const response = await fetch("http://localhost:3101/api/v1/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "admin@invest.com",
        password: "Admin@123",
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      console.error("Login failed:", response.status, text);
      process.exit(1);
    }

    const data = await response.json();
    console.log(data.token);
    fs.writeFileSync("token.txt", data.token);
    console.log("Token saved to token.txt");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

login();
