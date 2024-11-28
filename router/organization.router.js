const router = require('express').Router()
const auth = require('../middleware/auth.middleware')
const role = require('../middleware/role.middleware')
const jwt = require('jsonwebtoken')
const {client} = require('../utils/dbConnect')
const {owner_role} = require('../utils/sampleRoles')


router.post('/create',auth,async(req,res,next)=>{
    try{
        const org = await client.organization.create({
            data:{
                name:req.body.name,
                description:req.body.description||'',
                owner:Number(req.user.id)
            }
        })
        console.log("org:",org)
        const role = await client.role.create({
            data:{
                organization_id:Number(org.id),
                ...owner_role
            }
        })
        console.log("role:",role,req.user.id)   
        const membership = await client.membership.create({
            data:{
                user_id:Number(req.user.id),
                role_id:1,
                organization_id:Number(org.id)
            }
        })
        return res.json({message:"Organization created succesfully",org})
    }
    catch(err){
        next(err)
    }
})

router.get('/all',auth,async(req,res,next)=>{
    // route only for admin
    try{
        const orgs = await client.organization.findMany({
            where:{
                owner:Number(req.user.id)
            }
        })
        return res.json({message:"Organizations fetched succesfully",orgs})
    }
    catch(err){
        next(err)
    }
})

router.get('/get/:org_id',auth,role,async(req,res,next)=>{
    try{
        if(req.role.org_view){
            const org = await client.organization.findUnique({
                where:{
                    id:Number(req.params.org_id)
                },
                select:{
                    id:true,
                    name:true,
                    members:true,
                    description:true,
                    created_at:true,
                    updated_at:true,
                },
                include:{
                    members:{
                        select:{
                            id:true,
                            fname:true,
                            lname:true,
                            email:true,
                            role:true
                        }
                    }
                }
            })
            return res.json({message:"Organization fetched succesfully",org})
        }else{
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
    }
    catch(err){
        next(err)
    }
})

router.post('/edit/:org_id',auth,role,async(req,res,next)=>{
    try{
        const data = {}
        const {org_id} = req.params
        if(!org_id){
            res.statusCode = 400
            throw new Error("Invalid id")
        }
        if(req.body=={}) return res.json({message:"No data provided",data:{}})
        
        if(req.body.name) data.name = req.body.name
        if(req.body.description) data.description = req.body.description
        if(req.body.members) data.members = req.body.members
        if(req.body.owner) data.owner = req.body.owner

        if(req.role.org_update){
            const org = await client.organization.update({
                where:{id:Number(org_id)},
                data
            })
            return res.json({message:"Organization edited succesfully",org})
        }else{
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
    }
    catch(err){
        next(err)
    }
})

router.post('/addusers',auth,role,async(req,res,next)=>{
    try{
        const {organization_id} = req.body
        if(!req.role.org_update){
            res.statusCode = 403
            throw new Error("user doesn't have permission to edit")
        }
        const {users} = req.body
        // validate users here using zod
        const inserCount = await client.membership.createManyAndReturn({
            data:users.map(user=>({
                user_id:user.id,
                organization_id:organization_id,
                role_id:user.role_id||0
            }))
        })
        if(inserCount.length == users.length){
            return res.json({message:"Users added succesfully"})
        }else{
            res.statusCode = 206
            const failure = users.filter(user=>!inserCount.find(ele=>ele.id==user.id))
            return res.json({message:"Some users not added",success:inserCount,failure:failure})
        }
    }catch(err){
        next(err)
    }
})

router.post('/removeusers',auth,role,async(req,res,next)=>{
    try{
        const {organization_id} = req.body
        if(!req.role.org_update){
            res.statusCode = 403
            throw new Error("user doesn't have permission to edit")
        }
        const {users} = req.body
        // validate users here using zod
        const deleteCount = await client.membership.deleteMany({
            where:{
                organization_id:Number(organization_id),
                user_id:{
                    in:users.map(user=>user.id)
                }
            }
        })
        // remove all the tasks assigned to user in that organization
        if(deleteCount.count == users.length)
            return res.json({message:"Users removed succesfully"})
        else
            return res.status(206).json({message:"Some users not removed"})
        
    }catch(err){
        next(err)
    }
})

router.get('/delete/:org_id',auth,role,async(req,res,next)=>{
    try{
        if(req.role.org_delete){
            console.log(req.params.org_id)
            const org = await client.organization.delete({
                where:{id:Number(req.params.org_id)}
            })
            // remove all the memberships, tasks, roles and task_assign
            return res.json({message:"Organization deleted succesfully",org})
        }else{
            res.statusCode = 403
            throw new Error("Unauthorized")
        }
    }
    catch(err){
        next(err)
    }
})

router.post('/invite/generate/:org_id',auth,role,async(req,res,next)=>{
    try{
        if(!req.role.org_update){
            res.statusCode = 403
            throw new Error("User doesn't have permission to invite users")
        }
            const {org_id} = req.params
            const {exp,role_id} = req.body
            const secret = process.env.INVITE_SECRET 
            const inviteToken = await jwt.sign({invitedBy:Number(req.user.id),organization:Number(org_id),role_id:role_id},secret,{expiresIn:exp})
            const inviteLink = `${process.env.FRONTEND_URL}/invite/${inviteToken}`
            return res.json({message:"Invite link generated succesfully",inviteLink})
        
    }catch(err){
        next(err)
    }
})

router.get('/invite/:inviteToken',auth,async(req,res,next)=>{
    try{
        const inviteToken = req.params.inviteToken
        if(!inviteToken){
            res.statusCode = 400
            throw new Error("Invalid Invite Link")
        }
        const secret = process.env.INVITE_SECRET
        const decoded = await jwt.verify(inviteToken,secret)
        const {invitedBy,organization,role_id} = decoded
        const org = await client.organization.findUnique({where:{id:organization}})
        if(!org){
            res.statusCode = 404
            throw new Error("Organization not found")
        }
        const isMember = await client.membership.findFirst({
            where:{
                organization_id:organization,
                user_id:Number(req.user.id)
            }
        })
        if(isMember){
            res.statusCode = 400
            throw new Error("User is already a member of this organization")
        }
        const invitedByCheck = await client.membership.findFirst({
            where:{
                organization_id:organization,
                user_id:invitedBy
            }
        })
        if(!invitedByCheck){
            res.statusCode = 400
            throw new Error("The person who invited you is no longer a member of this organization")
        }
        
        const addedMembership = await client.membership.create({
            data:{
                user_id:Number(req.user.id),
                organization_id:organization,
                role_id:role_id
            }
        })
        if(addedMembership){
            res.json({message:"You have joined the organization succesfully"})
        }
    }catch(err){
        if(err.name == "TokenExpiredError"){
            res.statusCode = 400
            err.message = "Invitation Expired"
        }else if(err.name == "JsonWebTokenError"){
            res.statusCode = 400
            err.message = "Invalid Invite Link"
        }
        next(err)
    } 
})

module.exports = router
