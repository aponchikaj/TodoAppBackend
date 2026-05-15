import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    email:{
        type:String,
        required:true
    },
    todoCount:{
        type:Number,
        default:0
    },
    
},{timestamps:true});

const USERS = mongoose.model('users',userSchema)
export default USERS;