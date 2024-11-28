module.exports = (err,req,res,next)=>{
    const statusCode = res.statusCode!=200?res.statusCode:500;
    const message = err.message || "Internal Server Error";
    return res.status(statusCode).json({
        success:false,
        message:message,
        stack:err.stack
    })
}