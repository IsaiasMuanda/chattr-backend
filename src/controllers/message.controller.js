import User from "../models/user.model.js";
import Message from "../models/message.model.js";
import cloudinary from "../lib/cloudinary.js";
import { getReceiverSocketId, io } from "../lib/socket.js";

const PAGE_SIZE = 50;

export const getUsersForSidebar = async (req, res) => {
  try {
    const loggedInUserId = req.user._id;
    const users = await User.find({ _id: { $ne: loggedInUserId } })
      .select("-password")
      .lean();

    return res.status(200).json(users);
  } catch (error) {
    console.error("Erro em getUsersForSidebar:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const getMessages = async (req, res) => {
  try {
    const { id: userToChatId } = req.params;
    const myId = req.user._id;

    // Paginação simples via cursor (antes de determinado _id)
    const { before } = req.query;
    const filter = {
      $or: [
        { senderId: myId, receiverId: userToChatId },
        { senderId: userToChatId, receiverId: myId },
      ],
    };
    if (before) filter._id = { $lt: before };

    const messages = await Message.find(filter)
      .sort({ _id: -1 })
      .limit(PAGE_SIZE)
      .lean();

    return res.status(200).json(messages.reverse());
  } catch (error) {
    console.error("Erro em getMessages:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};

export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { id: receiverId } = req.params;
    const senderId = req.user._id;

    if (!text && !image) {
      return res.status(400).json({ message: "Mensagem não pode ser vazia" });
    }

    // Verifica se o destinatário existe
    const receiverExists = await User.exists({ _id: receiverId });
    if (!receiverExists) {
      return res.status(404).json({ message: "Destinatário não encontrado" });
    }

    let imageUrl;
    if (image) {
      const upload = await cloudinary.uploader.upload(image, { folder: "messages" });
      imageUrl = upload.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text: text?.trim(),
      image: imageUrl,
    });

    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("Erro em sendMessage:", error.message);
    return res.status(500).json({ message: "Erro de servidor" });
  }
};
