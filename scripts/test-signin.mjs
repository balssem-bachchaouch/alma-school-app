// Simulates the exact request that next-auth/react signIn makes
const base = "http://localhost:3001";

// Step 1: get CSRF token
const csrfRes = await fetch(`${base}/api/auth/csrf`);
const { csrfToken } = await csrfRes.json();
const cookies = csrfRes.headers.get("set-cookie") ?? "";
console.log("CSRF token:", csrfToken);
console.log("Cookies set:", cookies.split(";")[0]);

// Step 2: POST credentials
const body = new URLSearchParams({
  csrfToken,
  email: "alma@test.com",
  password: "ALMA2024",
  callbackUrl: `${base}/`,
  json: "true",
});

const signInRes = await fetch(`${base}/api/auth/callback/credentials`, {
  method: "POST",
  headers: {
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: cookies.split(";")[0],
  },
  body: body.toString(),
  redirect: "manual",
});

console.log("\nSign-in response:");
console.log("Status:", signInRes.status);
console.log("Location:", signInRes.headers.get("location"));
const text = await signInRes.text();
console.log("Body:", text.slice(0, 500));
