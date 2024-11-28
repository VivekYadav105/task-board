const router = require('express').Router();
const {client} = require('../utils/dbConnect');
const role = require('../middleware/role.middleware');
const auth = require('../middleware/auth.middleware');

const isAssigned = async(taskId, userId) => {
    try{
        if(!req.user||!req.user.id){
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
        const isAssigned = await client.task.findUnique({
            where:{id:taskId,assignedTo:userId},
        })
        if(!isAssigned){
            res.statusCode = 403
            throw new Error("user doesn't own this task to edit")
        }
        return isAssigned.assignedTo
    }catch(err){
        next(err)
    }
}

router.get('/get/all',auth,(req,res,next)=>{
    // all tasks irrespective of organization
    const AssignedTasks = client.task.findMany({
        where:{
            assignedTo:req.user.id
        }
    })
    const ManagingTasks = client.task.findMany({
        where:{
            assignedBy:req.user.id
        }
    })
    const tasks = {
        to:AssignedTasks,
        by:ManagingTasks
    }
    res.json({message:"Tasks fetched succesfully",tasks})
})

router.get('/get/:org_id/all',auth,role,(req,res,next)=>{
    const {org_id} = req.params
    if(!org_id){
        res.statusCode = 400
        throw new Error("Invalid organization id")
    }
    if(!req.role.org_view){
        // can view tasks only if he is a part of organization
        res.statusCode = 403
        throw new Error("user doesn't have the previlge")
    }
    const tasks = client.task.findMany({
        where:{
            organization_id:org_id
        },
        include:{
            assignedBy:true,
            assignedTo:true,
            organization:true
        }
    })
    res.json({message:"Tasks fetched succesfully",tasks})
})

router.post('/edit/:task_id',auth,role,async(req,res,next)=>{
    try{
        const {task_id} = req.params
        if(!task_id){
            res.statusCode = 400
            throw new Error("Invalid task id")
        }

        const data = {}
        if(req.body.status) data.status = req.body.status

        const need_permission = Object.keys(req.body).find(key=>['title','description','organization_id','priority','deadline'].includes(key))

        if(!req.role.task_edit&&need_permission){
            res.statusCode = 403
            throw new Error("user doesn't have the previlge")
        }
        
        if(req.body.title) data.title = req.body.title
        if(req.body.description) data.description = req.body.description
        if(req.body.organization_id) data.organization_id = req.body.organization_id
        if(req.body.priority) data.priority = req.body.priority
        if(req.body.deadline) data.dueDate = req.body.deadline

        const editCount = await client.task.update({
            where:{id:task_id},
            data
        })

        return res.json({message:"Task updated succesfully"})
    }catch(err){
        next(err)
    }
})

router.post('/create/:org_id',auth,role,async(req,res,next)=>{
    try{
        const {org_id} = req.params
        const status = await client.task.create({
            data:{
                ...req.body,
            }
        })
    }catch(err){
        next(err)
    }
})

router.post('/delete/:task_id',auth,role,async(req,res,next)=>{
    try{
        if(!req.role.task_delete){
            throw new Error("user doesn't have the previlge")
        }
        const {task_id} = req.params
        if(!task_id){
            res.statusCode = 400
            throw new Error("Invalid task id")
        }
        const deleteCount = await client.task.delete({
            where:{id:task_id}
        })
        res.json({message:"Task deleted succesfully"})
    }catch(err){
        next(err)
    }
})

router.post('/assign/:task_id',auth,role,async(req,res,next)=>{
    try{
        const {task_id} = req.params
        if(!task_id){
            res.statusCode = 400
            throw new Error("Invalid task id")
        }
        const {user_id} = req.body
        if(!user_id){
            res.statusCode = 400
            throw new Error("Invalid user id")
        }
        if(!req.role.task_assign){
            res.statusCode = 403
            throw new Error("user doesn't have the previlge")
        }
        const already_assigned = await isAssigned(task_id,user_id)
        if(already_assigned){
            res.statusCode = 400
            throw new Error("user already assigned to this task")
        }
        const assignCount = await client.task.update({
            where:{id:task_id},
            data:{
                assignedTo:user_id,
                assignedBy:req.user.id
            }
        })
        res.json({message:"Task assigned succesfully"})
    }catch(err){
        next(err)
    }
})

router.post('/unassign/:task_id',auth,role,async(req,res,next)=>{
    try{
        const {task_id} = req.params
        if(!task_id){
            res.statusCode = 400
            throw new Error("Invalid task id")
        }
        if(!req.role.task_assign){
            res.statusCode = 403
            throw new Error("user doesn't have the previlge")
        }
        const assignCount = await client.task.update({
            where:{id:task_id},
            data:{
                assignedTo:null,
                assignedBy:req.user.id
            }
        })
        res.json({message:"Task unassigned succesfully"})
    }catch(err){
        next(err)
    }
})

module.exports = router