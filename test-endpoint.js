
const jwt = require("jsonwebtoken");
require("dotenv").config();

const adminId = "6abb4d9cff0b590b5fa808cc"; // from my earlier DB check
const token = jwt.sign({ id: adminId }, process.env.JWT_ACCESS_SECRET, { expiresIn: "1h" });

const run = async () => {
  try {
    const res = await fetch("http://localhost:4000/api/v1/admin/admins", {
      headers: { Authorization: "Bearer " + token }
    });
    console.log("Status:", res.status);
    const data = await res.json();
    console.log("Data:", JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
};
run();

