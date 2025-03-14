const mongoose = require("mongoose");

const listFriendSchema = new mongoose.Schema({
    userId1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    userId2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    notification: { type: String, default: null },
    status: { type: String, enum: ["waiting", "friend"], default: "waiting" }
});

const ListFriend = mongoose.model("ListFriend", listFriendSchema);
module.exports = ListFriend;