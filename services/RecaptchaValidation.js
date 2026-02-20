const validateRecaptcha = async (recaptchaToken) => {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;

  if (!secretKey) {
    throw new Error("RECAPTCHA_SECRET_KEY is not defined");
  }

  const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `secret=${secretKey}&response=${recaptchaToken}`,
  });

  const data = await response.json();

  // 🔍 TEMP LOG (remove after testing)

  return data; // ✅ MUST return full object
};

module.exports = { validateRecaptcha };
