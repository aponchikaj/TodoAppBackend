import express from 'express'
import checkAuth from '../../middlewares/auth.middleware.js';
import newError from '../../services/newError.service.js';
import TODOS from '../../models/todo.model.js';
import mongoose from 'mongoose';
import USERS from '../../models/user.model.js';

const router = express.Router();

const FileLocation = '/src/routes/todos/todos.js';

router.get('/todos',checkAuth,async(req,res)=>{
    const {status,priority,search,sort='createdAt',order='desc',page=1,limit=10} = req.query;

    try{
        
        const filter = {user: req.user._id};

        if (status && ["To Do","In Progress","Done"].includes(status)) {
            filter.status = status
        }

        if (priority && ['low', 'medium', 'high'].includes(priority)) {
            filter.priority = priority
        }

        if (search && search.trim()) {
            filter.$or = [
                { title: { $regex: search.trim(), $options: 'i' } },
                { description: { $regex: search.trim(), $options: 'i' } },
            ]
        }

        const allowedSortFields = ['createdAt', 'updatedAt', 'dueDate', 'priority', 'title'];
        const sortField = allowedSortFields.includes(sort) ? sort : 'createdAt';
        const sortOrder = order === 'asc' ? 1 : -1

        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10)); 
        const skip = (pageNum - 1) * limitNum

        const [todos, total] = await Promise.all([
            TODOS.find(filter)
                .sort({ [sortField]: sortOrder })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            TODOS.countDocuments(filter),
        ]);

        const totalPages = Math.ceil(total / limitNum)

        return res.send({
            Success: true,
            Message: todos,
            Pagination: {
                total,
                totalPages,
                currentPage: pageNum,
                limit: limitNum,
                hasNextPage: pageNum < totalPages,
                hasPrevPage: pageNum > 1,
            },
        })

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.post('/todos',checkAuth,async(req,res)=>{
    const {title,description,status,priority,dueDate} = req.body;

    if (!title || title.trim().length === 0) return res.send({ Success: false, Message: 'Title is required.' });
    
    if(title.trim().length> 200) return res.send({ Success: false, Message: 'Title too long.'})
    if(status &&!['To Do','In Progress','Done'].includes(status)) return res.send({ Success: false, Message: 'Invalid status.'})
    if(priority&&!['low','medium','high'].includes(priority)) return res.send({ Success: false, Message: 'Invalid priority.'})
    if(dueDate&&new Date(dueDate) <new Date().setHours(0, 0, 0, 0)) return res.send({ Success: false, Message: 'Due date cannot be in the past.'})

    try{

        const todo = await TODOS.create({
            userID: req.user._id,
            todoTitle: title.trim(),
            todoDescription: description?.trim() || '',
            status: status || 'To Do',
            priority: priority || 'medium',
            dueDate: dueDate || null,
        });

        return res.send({ Success: true, Message: todo });

    }catch(e){  
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.get('/todos/:id',checkAuth,async(req,res)=>{
    const {id} = req.params

    if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.send({Success:false,Message:"Invalid todo id."})

    try{
        const TODO = await TODOS.findOne({userID:req.user._id,_id:id});
        if(!TODO) return res.send({Success:false,Message:"Todo not found."})

        return res.send({Success:false,Message:TODO})

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.put('/todos/:id',checkAuth,async(req,res)=>{
    const {id} =req.body;

    const {title,description,status,priority,dueDate} = req.body

    if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.send({Success:false,Message:"Invalid todo id."})

    if(!title || title.trim().length === 0) return res.send({ Success: false, Message: 'Title is required.' });
    if(title.trim().length> 200) return res.send({ Success: false, Message: 'Title too long.'})
    if(status &&!['To Do','In Progress','Done'].includes(status)) return res.send({ Success: false, Message: 'Invalid status.'})
    if(priority&&!['low','medium','high'].includes(priority)) return res.send({ Success: false, Message: 'Invalid priority.'})
    if(dueDate&&new Date(dueDate) <new Date().setHours(0, 0, 0, 0)) return res.send({ Success: false, Message: 'Due date cannot be in the past.'})

    try{

        const TODO = await TODOS.findOne({userID:req.user._id,_id:id});
        if(!TODO) return res.send({Success:false,Message:"Todo not found."});

        await TODOS.findOneAndUpdate({
            todoTitle: title.trim(),
            todoDescription: description?.trim() || '',
            status: status || 'To Do',
            priority: priority || 'medium',
            dueDate: dueDate || null,
        })

        return res.send({Success:false,Message:"Saved."})

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

router.delete('/todos/:id',checkAuth,async(req,res)=>{
    const {id} = req.body;

    if(!id || !mongoose.Types.ObjectId.isValid(id)) return res.send({Success:false,Message:"Invalid todo id."})
    try{
        
        const TODO = await TODOS.findOne({_id:id,userID:req.user._id})
        if(!TODO) return res.send({Success:false,Message:"Todo not found."});

        TODOS.findOneAndDelete({_id:id});

        return res.send({Success:true,Message:"Deleted."})

    }catch(e){
        await newError(e,FileLocation)
        return res.send({Success:false,Message:"Server error."})
    }
})

export default router;