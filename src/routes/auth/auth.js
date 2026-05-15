import express from 'express';
import newError from '../../services/newError.service.js';
import USERS from '../../models/user.model.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt';
import checkAuth from '../../middlewares/auth.middleware.js';

const router = express.Router()

const FileLocation = '/src/routes/auth/auth.js';

const regex = {
    usernameRegex: /^[a-zA-Z0-9_]{3,20}$/,
    passwordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
}

router.post('/register',async(req,res)=>{
    const {username,password,email} = req.body;

    if (!username || !regex.usernameRegex.test(username)) return res.send({Success:false, Message:"Invalid Username"});
    if (!password || !regex.passwordRegex.test(password)) return res.send({Success:false, Message:"Invalid Password."});
    if (!email || !regex.emailRegex.test(email)) return res.send({Success:false, Message:"Invalid email."});

    try{

        const findUsername = await USERS.findOne({username:username});
        if(findUsername) return res.send({Success:false,Message:"Username already registered."});

        const findEmail = await USERS.findOne({email:email});
        if(findEmail) return res.send({Success:false,Message:"Email already exists."});

        const hashedPassword = await bcrypt.hash(password,12);

        const newUser = await USERS.create({
            password:hashedPassword,
            email:email,
            username:username
        });

        const userToken = jwt.sign({ userID: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

        res.cookie('userToken', userToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 7 * 24 * 60 * 60 * 1000 
        });

        return res.send({ Success: true, Message: "Registered successfully" });

    }catch(e){
        await newError(e,FileLocation);
        return res.send({Success:false,Message:"Server Error."})
    }
})

router.post('/login',async(req,res)=>{
    const {user,password} =req.body;
    
    if (!user || !password) return res.send({ Success: false, Message: "Missing credentials." });
    const userType = user.includes('@') ? "email" : "username";

    try{

        const USER = userType == 'email' ? await USERS.findOne({email:user}) : await USERS.findOne({username:user});
        if(!USER) return res.send({Success:false,Message:"Invalid Credentials."});

        const comparePassword = await bcrypt.compare(password,USER.password);
        if(!comparePassword) return res.send({Success:false,Message:"Invalid Credentials."});

        const userToken = jwt.sign({ userID: USER._id }, process.env.JWT_SECRET, { expiresIn: '7d' })

        res.cookie('userToken',userToken,
            {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        )
        return res.send({Success:true,Message:"Logged in"})
    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.post('/logout',checkAuth,async(req,res)=>{
    try{

        res.clearCookie('userToken');
        return res.send({Success:true,Message:"Logged out"})

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.get('/me',checkAuth,async(req,res)=>{
    try{
        
        const USER = await USERS.findById(req.user._id).select('-password');

        return res.send({Success:true,Message:USER});

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

export default router;