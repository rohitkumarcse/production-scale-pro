const app = require("./app");

const PORT = process.env.PORT || 3000;
const SERVER_ID = process.env.SERVER_ID || "unknown";

app.listen(PORT, () => {
  console.log(
    `[${SERVER_ID}] Server running on port ${PORT}`
  );
});