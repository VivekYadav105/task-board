const PrismaClient = require('@prisma/client').PrismaClient

const client = new PrismaClient()

client.$connect().then(()=>{
    console.log("connected to database");
}).catch(err=>{
    console.log(err);
})

const roles = client.role.createMany({
    data:{
        name:"admin",
        description:'The admin role with all the previliges'
    }
})