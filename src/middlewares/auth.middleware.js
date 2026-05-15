import jwt from 'jsonwebtoken'
import USERS from '../models/user.model.js';

const checkAuth = async(req,res,next)=>{
    try{
        const userToken = req.cookies['userToken'];
        if(!userToken) return res.send({Success:false,Message:"Unauthorized."});

        const decoded = await jwt.verify(userToken,process.env.JWT_SECRET);
        const USER = await USERS.findById(decoded.userID).select('-password');

        if(!USER ) return res.send({Success:false,Message:"User not found."});

        req.user = USER;
        next();
    }catch(e){
        return res.send({Success:false,Message:"Unauthorized"});
    }
}

export default checkAuth;