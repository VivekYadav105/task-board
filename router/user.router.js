// users onboard the platform   
const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const {sendVerificationMail,sendForgotEmail} = require('../utils/sendMail')
const {client} = require('../utils/dbConnect')
const  auth  = require('../middleware/auth.middleware')
const role = require('../middleware/role.middleware')
const router = express.Router()

router.post('/login',async(req,res,next)=>{
    try{
        const {email,password} = req.body
        const user = await client.user.findFirst({where:{email}})
        if(!user){
            res.statusCode = 400
            throw new Error("Credentials doesn't match")
        }
        const hashedPassword = await bcrypt.compare(password,user.password)
        if(!hashedPassword){
            res.statusCode = 400
            throw new Error("Credentials doesn't match")
        }
        if(!user.isVerified){
            res.statusCode = 400
            throw new Error("please verify your account to login")
        }
        const {password:userPassword,...userDoc} = user
        const token = jwt.sign(userDoc,process.env.JWT_SECRET_MAIN,{expiresIn:'1h'})
        return res.json({message:"User Logged In succssfully",token:token})
    }
    catch(err){
        next(err)
    }
})

router.post('/signup',async(req,res,next)=>{
    try{
        const {password,fname,lname,email} = req.body
        const existingUser = await client.user.findUnique({where:{email}})
        let token;
        console.log("existing user:",existingUser)
        if(existingUser){
            res.statusCode = 409
            throw new Error("User alreasy exists")
        }else{
            const hashedPassword = await bcrypt.hash(password,10)
            const user = await client.user.create({
                data:{
                fname,lname,email,password:hashedPassword,
                }}
            )
            token = jwt.sign({fname,lname,email},process.env.JWT_SECRET_TEMP,{expiresIn:'10m'})
            let name = fname + " " + lname||''
            await sendVerificationMail(email,name,token)
        }
        return res.status(201).json({message:"please check your email for verification link",token})
    }
    catch(err){
        next(err)
    }
})

router.post('/forgot',async(req,res,next)=>{
    try{
        const {email} = req.body
        const user = await client.user.findUnique({where:{email}})
        if(!user){
            console.log("user not found");
            return res.json({message:"Please check the mobile for the otp code"})
        }
        const token = jwt.sign({id:user.id,mode:'resetPassword'},process.env.JWT_SECRET_TEMP,{expiresIn:'10m'})
        await sendForgotEmail(user.email,token)
        return res.json({message:`check your email for reset link`,token:token})
    }
    catch(err){
        next(err)
    }
})

router.post('/resendmail',async(req,res,next)=>{
    try{
        const {email} = req.body
        const user = await client.user.findUnique({where:{email}})
        if(!user){
            throw new Error("User with given email doesn't exist")
        }
        if(user.isVerified){
            res.statusCode = 409
            throw new Error("User is already verified")
        }
        token = jwt.sign({fname:user.fname,lname:user.lname,email},process.env.JWT_SECRET_TEMP,{expiresIn:'10m'})
        let name = user.fname + " " + user.lname||''
        await sendVerificationMail(email,name,token)
        return res.json({message:"verification mail send successfully"})
    }catch(err){
        next(err)
    }
})

router.get('/verify/:token',async(req,res,next)=>{
    try{
        const token = req.params.token
        console.log("token:",token);
        const payload = jwt.verify(token,process.env.JWT_SECRET_TEMP)
        const updatedCount = await client.user.update({where:{email:payload.email},data:{isVerified:true}})
        if(updatedCount.count===0){
            res.statusCode = 404
            throw new Error('User not found')
        }
        return res.json({message:"User verified Successfully"})
    }catch(err){
        console.log(err.name);
        switch(err.name){
            case 'JsonWebTokenError':
                res.statusCode = 403
                err.message = "Invalid Token"
                break;
            case 'TokenExpiredError':
                res.statusCode = 403
                err.message = "Token Expired"
        }
        next(err)
    }
})

router.get('/verifyToken',async(req,res,next)=>{
    try{
        log
        if(!req.headers.authorization||!req.headers.authorization.startsWith('Bearer')){
            res.statusCode = 403
            throw new Error("Session Expired")
        }
        const token = req.headers.authorization.split(' ')[1]
        if(!token){
            res.statusCode = 403
            throw new Error("Session Expired")
        }
        const payload = jwt.verify(token,process.env.JWT_SECRET_MAIN)
        return res.json({message:"Token Verified Successfully"})
    }catch(err){
        switch(err.name){
            case 'JsonWebTokenError':
                err.message = "Invalid Token"
                break;
            default:
                err.message = "Session Expired"
                break;
        }
        next(err)
    }
})

router.post('/reset/:token',async(req,res,next)=>{
    try{
        const {password} = req.body
        const token = req.params.token
        const {id} = jwt.verify(token,process.env.JWT_SECRET_TEMP)
        const user = await client.user.findUnique({where:{id}})
        if(!user){
            res.statusCode = 403
            throw new Error("Session Expired. Please try again!!")
        }
        const newpassword = await bcrypt.hash(password,10)
        const updatedUser = await client.user.update({where:{id},data:{password:newpassword}})
        return res.json({message:`Password reset sucessfully`})
    }catch(err){
        next(err)
    }
})

router.get('/reset/:token',async(req,res,next)=>{
    try{
        const token = req.params.token
        const success = jwt.verify(token,process.env.JWT_SECRET_TEMP)
        return res.json({message:'correct token'})
    }
    catch(err){
        res.statusCode = 403
        err.message = 'Session Expired or invalid token'
        next(err)
    }
})

router.post('/change_privilege/:org_id',auth,role,async(req,res,next)=>{
    if(req.role.promotion_privilege==0){
        res.statusCode = 403
        throw new Error("User doesn't have the privilege")
    }
    const {org_id} = req.params
    const {user_id,role_id} = req.body
    const role = await client.role.findUnique({where:{id:role_id}})
    const {promotion_privilege} = req.role
    if(promotion_privilege!=4&&role.promotion_privilege>promotion_privilege){
        res.statusCode = 403
        throw new Error("User doesn't have the privilge")
    }
    // check if user is in that organization
    const updated_member = await client.membership.update({
        where:{
            organization_id:org_id,
            user_id:user_id
        },
        data:{
            role_id:role.id
        }
    })
    return res.json({message:`User role changed to ${role.name}`})
})




module.exports = router