const mongoose =require('mongoose');

const coupondata=new mongoose.Schema({

    couponname:{
        type:String,
        required:true
    },
    couponcode:{
        type:String,
        required:true
    },
    discountamount:{
        type:Number,
        required:true
    },
    activationdate:{
        type:Date,
        required:true
    },
    expirydate:{
        type:Date,
        required:true
    },
    criteriaamount:{
        type:Number,
        required:true
    },
    userslimit:{
        type:Number,
        required:true
    },
    description:{
        type:String,
        required:true
    },
    status:{
        type:Number,
        default:0
    },
    claimedusers:[{
        type:Array
    }]


})
module.exports = mongoose.model("coupon",coupondata);