const express = require("express");
const cors = require("cors");
const userRouter = require("./router/user.router");
const taskRouter = require("./router/task.router");
const organizationRouter = require('./router/organization.router')
const roleRouter = require('./router/role.router')
const dotenv = require('dotenv')
const errorHandler = require('./middleware/error.middleware')

const morgan = require("morgan");
require('./utils/dbConnect')
dotenv.config()

const app = express();

const PORT = process.env.PORT||5000;


app.use(cors());
app.use(express.json());
morgan.token('body', (req) => JSON.stringify(req.body));
app.use(morgan(":method :url :body"));
app.use(express.urlencoded({ extended: false }));
app.use("/user", userRouter);
app.use('/task',taskRouter);
app.use('/organization',organizationRouter)
app.use('/role',roleRouter)

app.get('/',(req,res)=>{
  return res.send("Employex task")
})

app.use(errorHandler)


app.listen(PORT, (err) => {
  console.log("connected to server succesfully", PORT);
});

module.exports = app