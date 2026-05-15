import mongoose from "mongoose";

const todoSchema = new mongoose.Schema({
    todoTitle:{
        type:String,
        default:"Untitled",
        required:true
    },
    todoDescription:{
        type:String,
        default:"No description."
    },
    status:{
        type:String,
        enum:["To Do","In Progress","Done"],
        default:"To Do"
    },
    priority:{
        type:String,
        enum:["low","medium","high"],
        default:"medium"
    },
    dueDate:{
        type:Date
    },
    userID:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"users",
        required:true,
        index:true
    }
},{timestamps:true});

const TODOS = mongoose.model('todos',todoSchema);
export default TODOS;