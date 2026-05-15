import mongoose from 'mongoose'

const errorSchema = new mongoose.Schema({
    errorMessage:{
        type:String,
        default:"No message.",
    },
    errorLocation:{
        type:String,
        default:"No Location."
    },
},{timestamps:true})

const ERRORS = mongoose.model("errors",errorSchema)
export default ERRORS;