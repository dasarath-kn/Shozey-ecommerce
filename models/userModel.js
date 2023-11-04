const mongoose = require("mongoose");
const users = new mongoose.Schema({
    firstname: {
        type: String, 
        required: true,
    },
    lastname:{
        type: String,
        required:true
    },
    email: {
        type: String, 
        required: true,
    },
    phonenumber:{
        type:Number,
        required:true
    },
    password: {
        type: String, 
        required: true,
    },
    is_verified:{
        type: Number,
        requiredP:true
    },status:{
        type: Number,
        required:true
    }
})



module.exports = mongoose.model("user", users);
// module.exports=mongoose.model('category',productcategory);