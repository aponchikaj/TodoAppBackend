import express from 'express'
import USERS from '../../models/user.model.js'
import newError from '../../services/newError.service.js'
import checkAuth from '../../middlewares/auth.middleware.js'

const router = express.Router()
const FileLocation = 'src/routes/user/user.js'

router.get('/me',checkAuth,async(req,res)=>{
    try{

    }catch(e){
        
    }
})

export default router;