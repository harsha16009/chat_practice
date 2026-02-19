const Chat = require("../models/chat.model");
const Thread = require("../models/thread.model");
const asyncHandler = require("../utils/asyncHandler");
const { getIO, onlineUsers } = require("../socket/socket");

const User = require("../models/user.model");

//SENDMESSAGE
exports.sendMessage = asyncHandler(async (req, res) => {
    const { sender, receiver, message } = req.body;

    if (!sender || !receiver || !message) {
        return res.status(400).json({ message: "Missing Fields" });
    }

    // Find or create users
    const getOrCreateUser = async (username) => {
        let user = await User.findOne({ username });
        if (!user) {
            user = await User.create({ username });
        }
        return user;
    };

    const senderUser = await getOrCreateUser(sender);
    const receiverUser = await getOrCreateUser(receiver);

    //find or create thread
    let thread = await Thread.findOne({
        participants: { $all: [senderUser._id, receiverUser._id] }
    });

    if (!thread) {
        thread = await Thread.create({ participants: [senderUser._id, receiverUser._id] })
    }

    //create chat 
    const chat = await Chat.create({
        sender: senderUser._id,
        receiver: receiverUser._id,
        message,
        thread: thread._id,
    });

    //update thread
    thread.lastMessage = message;
    thread.lastMessageTime = new Date();
    await thread.save();

    //realtime emit
    const receiverSocket = onlineUsers.get(receiver);
    if (receiverSocket) {
        getIO().to(receiverSocket).emit("new_message", chat);
    }
    res.status(201).json(chat);

});

//GET MESSAGES BY THREAD

exports.getMessages = asyncHandler(async (req, res) => {
    const { threadId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    const messages = await Chat.find({ thread: threadId })
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(Number(limit));

    res.json(messages);
});