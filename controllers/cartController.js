const user = require('../models/userModel');
const product = require('../models/productModel');
const cart = require('../models/cartModel');
const coupon = require('../models/couponModel');
const wishlist = require('../models/wishlistModel');
const { render } = require('../router/userRouter');

//=================================== CART-MANAGEMENT =====================================//
const cartRendering = async (req, res) => {


    try {
        const coupondata = await coupon.find()
        const id = req.session.userId;
        const data = await cart.find({ userid: id });
        if(data!=0){
        const total = await cart.findOne({ userid: id }).populate('items.total');
        const standard = 49
        const express = 99
        const datatotal = total.items.map((item) => {
            return item.total * item.count;
        });

        let totalsum = 0;
        if (datatotal.length > 0) {
            totalsum = datatotal.reduce((x, y) => {
                return x + y;
            });
        }
        const cartvalue = await cart.find({userid:id})
        console.log(cartvalue);
   
        
        const cartdata = await cart.find({ userid: id }).populate("items.productid");
        
            res.render('cart', { user: req.session.name, cartdata, data, id, totalsum, express, standard, coupondata });
    
    }else{
        res.render('cart', { user: req.session.name, cartdata:0, data, id, totalsum:0, express:0, standard:0, coupondata:0 });

    }
 
        
    }
    catch (error) {
        console.log(error.message);
        res.render('500');
    }
}
//=================================== ADDING TO CART =====================================//


const cartAdding = async (req, res) => {
    try {


        const id = req.session.userId
        const productid = req.body.id

        const data = await product.findOne({ _id: productid });
        const cartdata = await cart.findOne({ userid: id, "items.productid": productid });


        if (id) {

            if (data.quantity > 1) {

                if (cartdata) {
                    const cartitems = await cart.findOne({ userid: id, 'items.productid': productid }, { 'items.$': 1 })
                    const count = cartitems.items[0].count

                    if (data.quantity > count) {
                        console.log("Existing data on cart");
                        await cart.updateOne(
                            { userid: id, "items.productid": productid },
                            { $inc: { "items.$.count": 1 } }
                        );
                        console.log("Cart product count increased");
                        res.json({ count: true })
                    }
                    else {
                        res.json({ result: false })
                    }

                }
                else {
                    var productprice
                    
                    if(data.discountamount){
                        if(data.offerstatus==0){
                            productprice =data.discountamount
                        }else{
                            productprice =data.price
                        }
                    }else{
                        productprice =data.price
                    }
                    const cartitems = {
                        productid: data._id,
                        count: 1,
                        total: productprice
                    }

                    await cart.findOneAndUpdate({ userid: id }, { $set: { userid: id }, $push: { items: cartitems } }, { upsert: true, new: true });

                    console.log('product added to the cart')
                    res.json({ result: true })

                }
            }
            else {
                res.json({ result: false })
            }

        }
        else {
            console.log("Login required");
        }
    }
    catch (error) {
        console.log(error.message);
        res.render('500');

    }
}

//=================================== ADDING THE COUNT  OF THE PRODUCT =====================================//

const AddingProductCount = async (req, res) => {
    try {

        const productid = req.body.id;
        const id = req.session.userId
        const val = req.body.val
        const data = await product.findOne({ _id: productid })
        console.log(productid);
        const cartitems = await cart.findOne({ userid: id, 'items.productid': productid }, { 'items.$': 1 })
        const count = cartitems.items[0].count
        console.log(count);

        if (data.quantity > 0) {
            if (val == 1) {
                if (data.quantity > count) {
                    await cart.updateOne(
                        { userid: id, "items.productid": productid },
                        { $inc: { "items.$.count": 1 } });
                    console.log("count increased");

                    res.json({ result: true });

                }
                else {
                    res.json({ result: false })
                }
            }

            else if (val == -1) {
                if (count > 1) {
                    await cart.updateOne(
                        { userid: id, "items.productid": productid },
                        { $inc: { "items.$.count": -1 } });
                    console.log("count decreased");

                    res.json({ result: true })
                }
                else {
                    console.log("Count 1 is fixed");
                }

            }

        }


    } catch (error) {
        console.log(error.message);
        res.render('500');

    }
}



//=================================== DELETE THE PRODUCT =====================================//

const deleteCartItems = async (req, res) => {
    try {
        console.log("eiooijoewj");
        const id = req.query.id
        const sessionid = req.session.userId;

        const data = await cart.updateOne({ userid: sessionid }, { $pull: { items: { productid: id } } });
        console.log(data);
        if (data) {
            res.redirect('/cart');
        }
        else {
            console.log("error");
        }

    } catch (error) {
        console.log(error.message);
        res.render('500');

    }
}



//=================================== WISHLIST =====================================//
const addtowishlist =async(req,res)=>{
    try {
        const id = req.body.id
        const session = req.session.userId
        const productddata = await product.findOne({_id:id})
        const wishlistdata = await wishlist.findOne({userid:session})
        const checkwishlistdata = await wishlist.findOne({userid:session,productid:id})
        
        
        if(session){
            if(wishlistdata){
                if(checkwishlistdata){
                    res.json({res:false})
                }else{
                await wishlist.updateOne({userid:session},{$push:{productid:id}})
                res.json({result:true})}
            }else{
            const data = new wishlist({
                userid:session,
                productid:id
            })

            await data.save()
            res.json({result:true})
        }}
        else{
            res.json({result:false})
        }
       
       
        
    } catch (error) {
        console.log(error.message);
        res.render('500');
        
    }
}

const wishlistview = async(req,res)=>{
    try {
        const id =req.session.userId
        const data = await product.find()
        const cartdata = await cart.find({ userid: id }).populate("items.productid")

        
            const wishlistdata = await wishlist.find({userid:req.session.userId}).populate("productid");
            if(wishlistdata!=0){
                res.render('wishlist',{wishlistdata,user:req.session.name,data,cartdata,id})

            }else{
                res.render('wishlist',{wishlistdata,user:req.session.name,data,cartdata,id})
      
            }
           
        
    } catch (error) {
       console.log(error.message); 
       res.render('500');
    }
} 


const deletewishlist = async(req,res)=>{
    try {
        const id = req.session.userId
        const productid = req.body.productid
        if(productid){
            await wishlist.updateOne({userid:id},{$pull:{productid:productid}})
            res.json({result:true})
        }else{
            console.log("productid is not there");
        }
        
        
    } catch (error) {
        console.log(error.message);
        res.render('500');
    }
}


module.exports = {
    cartAdding,
    cartRendering,
    AddingProductCount,
    deleteCartItems,
    addtowishlist,
    wishlistview,
    deletewishlist
}