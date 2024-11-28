const express = require('express');
const router = express.Router();
const {client} = require('../utils/dbConnect');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/role.middleware');

router.get('/:org_id/types',auth,async(req,res,next)=>{
    const {org_id} = req.params
    const membership = await client.role.findMany({
        where:{organization_id:Number(org_id)},
    })
    return res.json({message:"Roles fetched succesfully",data:membership})
})

router.get('/:org_id/users',async(req,res,next)=>{
    const {org_id} = req.params
    const membership = await client.membership.findMany({
        where:{organization_id:Number(org_id)},
        relationLoadStrategy:'join',
        include:{
            user:true,
        },
    })
    return res.json({message:"Users fetched succesfully",data:membership})
})

router.post('/:org_id/create',auth,role,async(req,res,next)=>{
    try{
        console.log("inside:",req.role.role_create)
        if(!req.role.role_create){
            res.statusCode = 403
        }
        const role = req.body
        if(!role){
            res.statusCode = 400
            throw new Error("Please provide a role")
        }
        const created_role = await client.role.create({
            data:{
                ...role,
                organization_id:Number(req.params.org_id),
            }
        })
        return res.json({message:"role created successfully"})
    }catch(err){
        next(err)
    }
})

router.post('/:org_id/edit',auth,role,async(req,res,next)=>{
    try{
        if(!req.role.role_edit){
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
        const {role_id} = req.body
        if(!role_id){
            res.statusCode = 400
            throw new Error("Please provide a role id")
        }
        await client.role.update({
            where:{
                id:role_id
            },
            data:{
                ...req.body
            }
        })
    }catch(err){
        next(err)
    }
})

router.post('/:org_id/delete',auth,role,async(req,res,next)=>{
    try{
        if(!req.role.role_delete){
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
        const {role_id} = req.body
        if(!role_id){
            res.statusCode = 400
            throw new Error("Please provide a role id")
        }
        const status = await client.role.delete({
            where:{
                id:Number(role_id),
                organization_id:Number(req.params.org_id)
            }
        })
    }catch(err){
        next(err)
    }
})

module.exports = router
