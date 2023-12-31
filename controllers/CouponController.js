const coupon = require('../models/couponModel');


const coupondata = async (req, res) => {

    try {

        const data = req.body.val
        const totalAmount = req.body.total
        const coupondata = await coupon.findOne({ couponcode: data });
        const checkcoupon =await coupon.findOne({ couponcode: data,claimedusers: req.session.userId  })
        const  claimedusers =await coupon.findOne({couponcode:data},{_id:0,claimedusers:1}).count()
        console.log(claimedusers);
        const  date = Date.now()
        // console.log(coupondata);

        const userlimit = coupondata.userslimit
        const criteriaamount = coupondata.criteriaamount
        if (checkcoupon ) {
          res.json({res:false})
        }
        else {
                if(coupondata){
            if (coupondata.couponcode == data) {
                if(userlimit>=claimedusers){
                if(criteriaamount<=totalAmount){
                if(coupondata.expirydate >date){
                const discountamount = coupondata.discountamount;
                const reducedamount = totalAmount - discountamount

             
                res.json({ result: true, reducedamount: reducedamount, discountamount: discountamount })}
                else{
                    res.json({date:false})
                }}
                else{
                    res.json({amount:false})
                }}else{
                    res.json({userlimit:false})
                }
            }
            else {
                res.json({ result: false })
            }}

            else{
                res.json({ result: false })
            }
        }



    } catch (error) {
        console.log(error.message);
        res.render('500');
    }

}

const deletecoupon = async (req, res) => {

    try {
        const total = req.body.total
        console.log(total);
        const value = req.body.value
        const data = await coupon.findOne({ couponcode: value });
       

        if (data) {
            res.json({ result: true, total: total })
        } else {
            res.json({ res:true  })
        }

    } catch (error) {
        console.log(error.message);
        res.render('500');
    }

}



module.exports = {
    coupondata,
    deletecoupon
};