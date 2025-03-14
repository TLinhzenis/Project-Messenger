const mongoose = require("mongoose");

const friendSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    userId2: { type: mongoose.Schema.Types.ObjectId, required: true, ref: "User" },
    status: { type: String, enum: ["pending", "friend"], required: true },
}, { timestamps: true });

const ListFriend = mongoose.model("ListFriend", friendSchema);
module.exports = ListFriend;
