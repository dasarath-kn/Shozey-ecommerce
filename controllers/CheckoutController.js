const user = require('../models/userModel');
const cart = require('../models/cartModel');
const product = require('../models/productModel');
const address = require('../models/addressModel');
const order = require('../models/orderModel');
const coupon = require('../models/couponModel');
const Razorpay = require('razorpay');
const crypto = require("crypto")
require('dotenv').config()

var instance = new Razorpay({
    key_id: process.env.RAZORPAYKEYID,
    key_secret: process.env.ROZORPAYSECRETKEY,
});

const checkoutdata = async (req, res) => {
    try {
        const total = req.body.val;
        const session = req.session.userId;
        const cartdata = await cart.findOne({userid:session});
        const data = cartdata.items;
        
        let count=0
        for(let i=0 ;i<data.length;i++){
            let productid = data[i].productid;
            let productcount =data[i].count;
            const productdata = await product.findOne({_id:productid});
            const productquantity = productdata.quantity; 
            if(productcount<=productquantity ){
                count++
            }else{
                count=0
              break;
            }
        }
        console.log(count);
        if (total == 0) {
            res.json({ result: false })
        } else {
            if(count>=1){
            res.json({ result: true })}
            else{
                res.json({res:true})
            }
        }

    } catch (error) {
        console.log(error.message);
    }
}

const ProceedtoCheckout = async (req, res) => {
    try {

        const coupondata = await coupon.find()
        const useraddress = await address.find({ userId: req.session.userId });
        const id = req.session.userId;
        const data = await product.find()
        const total = await cart.findOne({ userid: id }).populate('items.total');
        const datatotal = total.items.map((item) => {
            return item.total * item.count;
        });

        let totalsum = 0;
        if (datatotal.length > 0) {
            totalsum = datatotal.reduce((x, y) => {
                return x + y;
            });
        }
        const cartdata = await cart.find({ userid: id }).populate("items.productid")
        res.render('checkout', { user: req.session.name, data, cartdata, useraddress, totalsum, coupondata });

    } catch (error) {
        console.log(error.message);
    }
}

const ProceedOrder = async (req, res) => {
    try {
        // const productdata = await product.findOne({_id:productid});
        const id = req.session.userId
        const payment = req.body.payment
        const addressid = req.body.address
        const amount = req.body.total
        const data = req.body.couponcode;
        const coupondata = await coupon.findOne({ couponcode: data });
        const totalAmount = parseInt(amount)
        console.log(amount);

        const status = payment == "Cash on delivery" ? "placed" : 'pending'

        const addressdata = await address.findOne({ _id: addressid })




        const carts = await cart.findOne({ userid: id })
        const total = await cart.findOne({ userid: id }).populate('items.total');
        const datatotal = total.items.map((item) => {
            return item.total * item.count;
        });
        ///


        const cartData = await cart.findOne({ userid: id })
        const cartitems = await cart.findOne({ userid: id }).populate("items.productid")
        ///

        let totalsum = 0;
        if (datatotal.length > 0) {
            totalsum = datatotal.reduce((x, y) => {
                return x + y;
            });
            if (totalAmount) {
                var Total = totalsum - totalAmount
                await coupon.updateOne({ _id: coupondata._id }, { $push: { claimedusers: req.session.userId } })
            }
            else {
                Total = totalsum
            }

            const datas = new order({
                user_Id: id,
                deliveryDetails: addressdata.userdata[0],
                items: carts.items,
                purchaseDate: Date.now(),
                totalAmount: Total,
                status: "Pending",
                paymentMethod: payment,
                paymentStatus: "Pending",
                shippingMethod: "Express",
                shippingFee: "0",
                discountamount: totalAmount
            })
            const orderdata = await datas.save();
            if (payment == "Cash on delivery") {
                let data = cartData.items

                for (let i = 0; i < data.length; i++) {
                    let products = data[i].productid
                    let count = data[i].count
                    // console.log(product);

                    await product.updateOne({ _id: products }, { $inc: { quantity: -count } })
                }
                console.log("sdfewssdgdf");
                await cart.deleteOne({ userid: id })
                return res.json({ success: true }


                )
            } else if (payment == "Wallet") {
                return res.json({ online: true })

            } else {
                const options = {
                    amount: totalsum * 100,
                    currency: "INR",
                    receipt: "" + orderdata._id,
                }

                instance.orders.create(options, function (err, order) {

                    return res.json({ order });
                });

            }



            //   res.render('orderplaced',{user:req.session.name,data,cartdata});
        }

    } catch (error) {
        console.log(error.message);
    }


}

//=================================== Order details =====================================//

const orderdetails = async (req, res) => {

    try {
        const id = req.query.id;
        const data = await product.find()
        const cartdata = await cart.find({ userid: id }).populate("items.productid")
        const orderdata = await order.find({ _id: id }).populate("items.productid")

        console.log(orderdata);

        res.render('orderdetails', { orderdata, data, cartdata, user: req.session.name })

    } catch (error) {
        console.log(error.message);

    }

}

//===================================  Cancel Order  =====================================//

const cancelorder = async (req, res) => {
    try {
        console.log("uhshufdhj");
        const id = req.body.id;
        console.log(id);
         const val = await order.findOne({_id:id})
          const productid =req.body.productid ;
        // const ordercount= await order.findOne({_id:id},{'items.productid':productid})
        // console.log(ordercount);
        if(id){
        // await order.findByIdAndUpdate(id, { status: "cancelled" })
      const data=  await order.updateOne(
            {
              _id:id,
              'items.productid': productid,
            },
            {
              $set: {
                'items.$.status': "cancelled",
              },
            }
          );
          console.log(data);
        res.json({result:true})
        }else{
            console.log("Status is not changed ");
        }
       

        


       

    } catch (error) {
        console.log(error.message);
    }
}

//===================================   Order Placed  =====================================//

const orderplaced = async (req, res) => {
    try {
        res.render('orderplaced')

    } catch (error) {
        console.log(error.message);
    }
}

const verifypayment = async (req, res) => {
    try {
        const user_id = req.session.userId
        const paymentData = req.body
        const cartData = await cart.findOne({ userid: user_id })
        console.log(cartData);

        const hmac = crypto.createHmac("sha256", process.env.ROZORPAYSECRETKEY);
        hmac.update(paymentData.payment.razorpay_order_id + "|" + paymentData.payment.razorpay_payment_id);
        const hmacValue = hmac.digest("hex");

        if (hmacValue == paymentData.payment.razorpay_signature) {
            let data = cartData.items

            for (let i = 0; i < data.length; i++) {
                let products = data[i].productid
                let count = data[i].count
                console.log(product);

                await product.updateOne({ _id: products }, { $inc: { quantity: -count } })
            }

            await order.findByIdAndUpdate(
                { _id: paymentData.order.receipt },
                { $set: { paymentStatus: "placed", paymentId: paymentData.payment.razorpay_payment_id } }
            );

            await cart.deleteOne({ userid: user_id })
            res.json({ placed: true })
        }



    } catch (error) {
        console.log(error.message);
    }
}
module.exports = {
    ProceedtoCheckout,
    ProceedOrder,
    orderdetails,
    cancelorder,
    orderplaced,
    verifypayment,
    checkoutdata
}