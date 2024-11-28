const {client} = require('../utils/dbConnect');

const roleMiddleware =async(req,res,next)=>{
    try{
        const org_id = req.body.organization_id || req.params.org_id
        if(!req.user){ 
            res.statusCode = 403
            throw new Error('Unauthorized');
        }
        if(!org_id){
            res.statusCode = 400
            throw new Error('Please provide an organization id');
        }
        const org = await client.organization.findUnique({
            where:{id:Number(org_id)}
        })
        if(!org){
            res.statusCode = 404
            throw new Error('Organization not found');
        }
        const data = await client.membership.findUnique({
            where:{ 
                user_id_organization_id:{
                    user_id: Number(req.user.id),
                    organization_id: org.id,
                }               
            }
        })    
        if(!data){
            res.statusCode = 403
            throw new Error('User is not a part of this organization');
        }
        const role = await client.role.findUnique({
            where:{id:data.role_id}
        })
        req.role = role;
        next();
    }catch(err){
        res.statusCode = 403
        next(err);
    }
}

module.exports = roleMiddleware;