import { generateToken, getCloudinaryPublicId } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import cloudinary from "../lib/cloudinary.js";

export const signup = async (req, res) => {
  const { fullName, email, password } = req.body;
  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }
    if (password.length < 6) {
      return res.status(400).json({ message: "A senha deve ter no mínimo 6 caracteres" });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(409).json({ message: "Email já cadastrado" });

    const hashedPassword = await bcrypt.hash(password, 12);

    const newUser = await User.create({
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
    });

    generateToken(newUser._id, res);

    return res.status(201).json({
      _id: newUser._id,
      fullName: newUser.fullName,
      email: newUser.email,
      profilePic: newUser.profilePic,
    });
  } catch (error) {
    console.error("Erro em signup:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ message: "Preencha todos os campos" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    // Evita timing attack: compara mesmo se o usuário não existir
    const dummyHash = "$2b$12$invalidhashforanon-existentuser000000000000000000000000";
    const isValid = user
      ? await bcrypt.compare(password, user.password)
      : await bcrypt.compare(password, dummyHash);

    if (!user || !isValid) {
      return res.status(401).json({ message: "Credenciais inválidas" });
    }

    generateToken(user._id, res);

    return res.status(200).json({
      _id: user._id,
      fullName: user.fullName,
      email: user.email,
      profilePic: user.profilePic,
    });
  } catch (error) {
    console.error("Erro em login:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const logout = (_req, res) => {
  try {
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "Logout realizado com sucesso" });
  } catch (error) {
    console.error("Erro em logout:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { fullName, password, profilePic, bio } = req.body;
    const userId = req.user._id;

    if (!fullName && !password && !profilePic && bio === undefined) {
      return res.status(400).json({ message: "Nenhum campo enviado para atualização" });
    }

    const updateData = {};

    if (fullName) updateData.fullName = fullName.trim();
    if (bio !== undefined) updateData.bio = bio.trim();

    if (profilePic) {
      // Remove foto antiga do Cloudinary se existir
      const oldPublicId = getCloudinaryPublicId(req.user.profilePic);
      if (oldPublicId) {
        await cloudinary.uploader.destroy(oldPublicId).catch((e) =>
          console.warn("Falha ao remover foto antiga do Cloudinary:", e.message)
        );
      }
      const upload = await cloudinary.uploader.upload(profilePic, { folder: "profile_pics" });
      updateData.profilePic = upload.secure_url;
    }

    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ message: "A senha deve ter no mínimo 6 caracteres" });
      }
      updateData.password = await bcrypt.hash(password, 12);
    }

    const updated = await User.findByIdAndUpdate(userId, updateData, { new: true }).select("-password");

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Erro em updateProfile:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const deleteProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }

    const publicId = getCloudinaryPublicId(user.profilePic);
    if (publicId) {
      await cloudinary.uploader.destroy(publicId).catch((e) =>
        console.warn("Falha ao remover foto do Cloudinary:", e.message)
      );
    }

    await User.findByIdAndDelete(userId);
    res.cookie("jwt", "", {
      maxAge: 0,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
      secure: process.env.NODE_ENV === "production",
    });
    return res.status(200).json({ message: "Conta removida com sucesso" });
  } catch (error) {
    console.error("Erro em deleteProfile:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const getUserProfile = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await User.findById(id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    return res.status(200).json(user);
  } catch (error) {
    console.error("Erro em getUserProfile:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const checkAuth = (req, res) => {
  try {
    return res.status(200).json(req.user);
  } catch (error) {
    console.error("Erro em checkAuth:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};
