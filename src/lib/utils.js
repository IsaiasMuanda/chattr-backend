import jwt from "jsonwebtoken";

export const generateToken = (userId, res) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

  res.cookie("jwt", token, {
    maxAge: 7 * 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
    secure: process.env.NODE_ENV === "production",
  });

  return token;
};

/**
 * Extrai o public_id de uma URL do Cloudinary de forma segura.
 * Suporta pastas (ex: "folder/image_id").
 */
export const getCloudinaryPublicId = (url) => {
  if (!url) return null;
  try {
    const parts = url.split("/upload/")[1]; // tudo após /upload/
    if (!parts) return null;
    // Remove versão (v123456/) se existir
    const withoutVersion = parts.replace(/^v\d+\//, "");
    // Remove extensão
    return withoutVersion.replace(/\.[^.]+$/, "");
  } catch {
    return null;
  }
};
