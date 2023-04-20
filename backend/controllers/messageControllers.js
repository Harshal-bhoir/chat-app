const expressAsyncHandler = require("express-async-handler");

const Message = require('../models/messageModel');
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const sendMessage = expressAsyncHandler(async (req, res) => {
    const { content, chatId } = req.body

    if(!content || !chatId){
        console.log('invalid data passed into req')
        return res.sendStatus(400)
    }

    let newMessage = {
        sender: req.user._id,
        content: content,
        chat: chatId
    }

    try{
        let msg = await Message.create(newMessage)

        msg = await msg.populate('sender', 'name pic')
        msg = await msg.populate('chat')
        msg = await User.populate(msg, {
            path: 'chat.users',
            select: 'name pic email',
        })

        await Chat.findByIdAndUpdate(req.body.chatId, {
            latestMessage: msg
        })
        res.json(msg)
    } catch(err){
        res.status(400)
        throw new Error(err.message)
    }
})

const allMessages = expressAsyncHandler(async (req, res) => {
    try{
        const messages = await Message.find({ chat: req.params.chatId }).populate("sender", "name pic email").populate("chat")
        res.json(messages)
    } catch(e){
        res.status(400)
        throw new Error(err.message)
    }
})

module.exports = {sendMessage, allMessages}