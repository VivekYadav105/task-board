const nodemailer = require("nodemailer");
require('dotenv').config()

const testAccount = {
    email:process.env.MAIL_USERNAME,
    password:process.env.MAIL_PASSWORD
}

const sendVerificationMail = async(to,name,token)=>{
    return new Promise(async(resolve,reject) =>{
        let transporter = await nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: testAccount.email,
              pass: testAccount.password,
            },
        });
        let url = `${process.env.NODE_FRONTEND_URL}/auth/verify/${token}`;

        let content = `<h4>Hello ${name}</h4>
        <p>Please click <a href="${url}" rel="noopener noreferrer">here</a> or use the link below:</p>
        <a href="${url}" rel="noopener noreferrer">${url}</a>`;


        let k = Math.floor(Math.random() * 100);
        let from  = `no-reply <employex${k}@gmail.com>`
        transporter.sendMail({
            to,from:from,
            html:content,subject:"Verify your email to proceed"
        },
        (err,info)=>{
           if(err||info.rejected.length){
            console.log(err);
            return reject("Failed to send Verification mail")
           } 
           else return resolve("Verification mail sent successfully")
        }  
        )
    })
}

const sendForgotEmail = async(to,name,token)=>{
    return new Promise(async(resolve,reject) =>{
        let transporter = await nodemailer.createTransport({
            service: "gmail",
            auth: {
              user: testAccount.email,
              pass: testAccount.password,
            },
        });
        let url = `${process.env.NODE_FRONTEND_URL}/auth/reset/${token}`;
        let content = `<h4>Hello ${name}</h4>
                        <p>Please click <a href="${url}" rel="noopener noreferrer">here</a> or use the link below:</p>
                        <a href="${url}" rel="noopener noreferrer">${url}</a>
                    `;

        let k = Math.floor(Math.random() * 100);
        let from  = `no-reply <employex${k}@gmail.com>`
        transporter.sendMail({
            to,from:from,
            html:content,subject:"Reset link for your password"
        },
        (err,info)=>{
           if(err||info.rejected.length){
            console.log(err);
            return reject("Failed to send reset link mail")
           } 
           else return resolve("reset link sent successfully")
        }  
        )
    })
}

// const sendCreationMail = async(employee,password) =>{
//     return new Promise(async(resolve,reject) =>{
//         let transporter = await nodemailer.createTransport({
//             service: "gmail",
//             auth: {
//               user: testAccount.email,
//               pass: testAccount.password,
//             },
//         });
//         let content = `<h4>Hello ${employee.fname} ${employee.lname}</h4>
//                         <br/>Your account has been created.
//                         Your password is ${password}
//                         Your Details are as follows:
//                         <pre>${employee}</pre>
//                         `
//         let k = Math.floor(Math.random() * 100);
//         let from  = `no-reply <employex${k}@gmail.com>`
//         transporter.sendMail({
//             to:employee.email,from:from,
//             html:content,subject:"User profile created"
//         },
//         (err,info)=>{
//            if(err||info.rejected.length){
//             console.log(err);
//             return reject("Failed to send creation mail")
//            } 
//            else return resolve("mail sent successfully")
//         }  
//         )
//     })
// }


module.exports = {sendVerificationMail,sendForgotEmail}