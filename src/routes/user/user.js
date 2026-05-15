import express from 'express'
import USERS from '../../models/user.model.js'
import newError from '../../services/newError.service.js'
import checkAuth from '../../middlewares/auth.middleware.js'
import bcrypt from 'bcryptjs'
import TODOS from '../../models/todo.model.js'

const router = express.Router()
const FileLocation = 'src/routes/user/user.js'

router.get('/me',checkAuth,async(req,res)=>{
    try{
        
        const USER = await USERS.findById(req.user._id).select('-password');

        return res.send({Success:true,Message:USER});

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.put('/password',checkAuth,async(req,res)=>{
    const {password,oldPassword} = req.body;

    const passwordRegex= /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    if(!password || !passwordRegex.test(password)) return res.send({Success:false,Message:"Invalid Password."})

    try{

        const USER = await USERS.findOne({_id:req.user._id});
        const compare = await bcrypt.compare(oldPassword,USER.password);

        if(!compare) return res.send({Success:false,Message:"Invalid old password."})

        const hashedPassword = await bcrypt.hash(password,12)
        await USERS.findByIdAndUpdate(req.user._id,{password:hashedPassword});

        return res.send({Success:true,Message:"Saved."})

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.delete('/me',checkAuth,async(req,res)=>{
    try{
        const USER = await USERS.findOne({_id:req.user._id});
        if(!USER) return res.send({Success:false});

        await TODOS.deleteMany({userID:USER._id})

        await USERS.findOneAndDelete({_id:req.user._id});

        return res.send({Success:true,Message:"Deleted."})
    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

export default router;