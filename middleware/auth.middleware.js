require('dotenv').config();
const jwt = require('jsonwebtoken')

const authMiddleware = (req, res, next) => {
    try{
        console.log(req.headers.authorization)
        if (req.headers.authorization&&req.headers.authorization.startsWith('Bearer ')){
          const token = req.headers.authorization.split(' ')[1];
          const decodedToken = jwt.verify(token, process.env.JWT_SECRET_MAIN);
          req.user = decodedToken;
          next();
        } else {
            res.statusCode = 403
            throw new Error('Unauthorized');
        }
    }catch(err){
        res.statusCode = 403
        next(err);
    }
};

module.exports = authMiddleware;