const {PrismaClient} = require('@prisma/client')

const client = new PrismaClient()

client.$connect().then(() => {
    console.log("connected to database");
}).catch(err=>{
    console.log(err);
})

const getClient = () => client

module.exports = {getClient,client}