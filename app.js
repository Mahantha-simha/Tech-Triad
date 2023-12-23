
require('dotenv').config()
const express = require("express")
const bodyparser = require("body-parser")
const ejs = require("ejs")
const mongoose = require("mongoose")
const { connected } = require("process")
const session = require("express-session");
const passportlocal = require("passport-local");
const passportLocalMongoose = require("passport-local-mongoose");
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
const nodemailer = require('nodemailer');
const { WebhookClient } = require('dialogflow-fulfillment');
const path = require('path');
const app = express()

app.use(express.static("public"))
app.set('view engine', "ejs")
app.use(bodyparser.urlencoded({ extended: true }))
app.use(session({
    secret: 'keyboardcatdogcst',
    resave: false,
    saveUninitialized: false
      
}));

app.use(bodyparser.json());
app.use(passport.initialize());
app.use(passport.session());



const password = process.env.MONGOOSE_ALTAS_PASSWORD;
mongoose.connect("mongodb+srv://mahanthasimha37:"+password+"@mahanthasimha.0g62iuc.mongodb.net/user")
    .then(() => console.log('Connected!'));


const userSchema = new mongoose.Schema({  //here we are creating new Manja structure
    name: String,
    password: String,
    googleId: String,
    secret:[String]
})
const sudinfo = new mongoose.Schema({
    name:String,
    email:String,
    DOB:Date,
    senester:String,
    studentNO:Number,
    parentname:String,
    parentsno:String,
    
    
}) 





userSchema.plugin(passportLocalMongoose);//this will add salting and hashing to the code
userSchema.plugin(findOrCreate);//this is for the pakage findorcreate


const User = mongoose.model("User", userSchema)
const StudentInfo=mongoose.model("StudentInfo",sudinfo)



passport.use(User.createStrategy());

passport.serializeUser(function (user, done) {//this for the passportLocalMongoose
    done(null, user.id);
});

passport.deserializeUser(function (id, done) {//this for the passportLocalMongoose
    User.findById(id)
        .exec()
        .then(user => {
            done(null, user);
        })
        .catch(err => {
            done(err, null);
        });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        // console.log(profile) i can see all the information about the person 
        User.findOrCreate({ googleId: profile.id, username: profile.displayName }, function (err, user) {//findorcreate is not a mongoose thing ,we need  install findorcreate pakeage from npm
            return cb(err, user);
        });
    }
));

app.use((req, res, next) => {
    console.log('Current user ID:', req.user ? req.user.id : 'No user logged in');
   
    next();

  });

app.get('/', (req, res) => {
     
    res.render("home")
    
})

app.get('/register', (req, res) => {
    res.render("register")
})
app.get('/auth/google',// This path came from the login.EJS file on line number 31.
    passport.authenticate('google', { scope: ["profile"] }));

app.get('/auth/google/secrets',// this is a callback function given by the Google which we are redirecting to the secret page
    passport.authenticate('google', { failureRedirect: "/login " }),
    function (req, res) {
        // Successful authentication, redirect home.
        res.redirect('/secrets');
    });


app.get('/login', (req, res) => {
    res.render("login");
})

app.get("/logout", (req, res) => {
    res.redirect("/")
})
app.get("/info",(req,res)=>{
    res.render("info")
})
app.get("/adminlogin",(req,res)=>{
    res.render('adminlogin')
})

app.get('/admincode',(req,res)=>{
    res.render('admincode')
})
app.get('/chatbot',(req,res)=>{
    res.render('chatbot')
})
app.get('/sendmailstd',(req,res)=>{
    res.render('sendmailstd')
})
app.get('/paremailsend',(req,res)=>{
    res.render('paremailsend')
})
app.get("/timetable",(req,res)=>{
    res.render('timetable')
})

// app.get("/forgotpassword",(req,res)=>{

//     StudentInfo.find({}, 'email')
//     .then(users => {
//         const userEmails = users.map(user => user.email);
//         console.log(userEmails);

//         // Create a transporter object using SMTP transport
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',
//             auth: {
//                 user: process.env.EMAIL,
//                 pass: process.env.EMAIL_PASSWORD
//             }
//         });

//         // Define email options
//         const mailOptions = {
//             from: process.env.EMAIL,
//             subject: 'Subject of the email',
//             text: 'Body of the email'
//         };

//         // Loop through user emails and send emails
//         userEmails.forEach(userEmail => {
//             mailOptions.to = userEmail;

//             // Send the email
//             transporter.sendMail(mailOptions, (error, info) => {
//                 if (error) {
//                     console.error(`Error sending email to ${userEmail}:`, error.message);
//                 } else {
//                     console.log(`Email sent to ${userEmail}:`, info.response);
//                     res.redirect('/');
//                 }
//             });
//         });
//     })
//     .catch(err => {
//         console.error(err);
//     });

//     });
// // //     const result = StudentInfo.find({})
// // //    console.log(result.username);


// //     const transporter = nodemailer.createTransport({
// //         service:'gmail',
// //         auth: {
// //           user:process.env.EMAIL,
// //           pass:process.env.EMAIL_PASSWORD
// //         }
// //       });
    
      
// //       const mailOptions = {
// //         from: process.env.EMAIL,
// //         to: 'battlegroundsmobileindia69@gmail.com',
// //         subject: 'Sending Email using Node.js',
// //         text: 'That was easy!'
// //       };
      
// //       transporter.sendMail(mailOptions).then((info)=>{
// //          if(info){   
// //           console.log('Email sent: ' + info.response);
// //            res.redirect("/login");
// //          }
         
// //     })
// //     .catch(err=>{
// //           console.log("error"+err);
// //     })
// // }) 

app.get("/secrets", (req, res) => {
    User.find({ "secret": { $ne: null } })
        .exec()
        .then(foundUsers => {
            if (foundUsers) {
                res.render("secrets",{ usersWithSecrets: foundUsers });//this will add all the data to database and also display it
            }
        })
        .catch(err => {
            console.log(err);
        });
})
app.get("/submit", (req, res) => {
    if (req.isAuthenticated()) {//if  the secret page is authenticated We can open the secret page directly
        res.render("submit");// and isauthenticated function is A function from passport.JS

    }
    else {
        res.redirect("/login");
    }
})
app.use('/Studentinfo', async (req, res) => {
    
    try {
      // Fetch all students from the 'students' collection
      const students = await StudentInfo.find({});
  
      // Render the EJS page and pass the data
      res.render('Studentinfo', { students });
    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  });
app.post("/submit", (req, res) => {
   
    const usersecret = req.body.secret;
    
    if (req.isAuthenticated()) {
        // User is authenticated, proceed with updating the secrets
        User.findById(req.user.id)
            .then(foundUser => {
                if (foundUser) {
                //    foundUser.secret=usersecret;
                   foundUser.secret = foundUser.secret || [];
                   foundUser.secret.push(usersecret);
                
                 

                       foundUser.save()
                        .then(() => {
                            res.redirect("/secrets");
                        })
                        .catch(error => {
                            console.error(error);
                        });
                } else {
                    throw new Error('User not found');
                }
            })
            .catch(error => {
                console.error(error);
            });
    } else {
        // User is not authenticated, redirect to login or handle it accordingly
        res.redirect("/login");
    }
});



app.post("/register", (req, res) => {

    const username = req.body.username;
    const newUser = new User({ username: username });

    console.log(username);
    User.register(newUser, req.body.password, function (err, user) {//from passport
        if (err) {
            console.log(err);
            res.send("username is already registerd")
            res.redirect("/register");
        }
        else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            })
        }

    });

});


app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});
app.post("/info",(req,res)=>{

    const username= req.body.username
    const userEmail=req.body.userEmail
    const DOB=req.body.DOB
    const Semester=req.body.Semester
    const studentno=req.body.studentno
    const pgpname=req.body.pgpname
    const pgpno=req.body.pgpno

  const studentinformation =new StudentInfo({
    
    name:username,
    email:userEmail,
    DOB:DOB,
    senester:Semester,
    studentNO:studentno,
    parentname:pgpname,
    parentsno:pgpno,
  })
   studentinformation.save();

    res.redirect("/register");
})

app.post("/adminlogin",(req,res)=>{

   

     if(req.body.username==='mahi@gmail.com'&&req.body.password==="123456789"){
        res.render('secrets')
     }else{
        res.redirect("adminlogin")
     }   
})
app.post('/chatbot', (req, res) => {
    const userMessage = req.body.message;
  
    // Use the chatbot.js library to get a response
    const botResponse = chatbot.getResponse(userMessage);
  
    // Return the response to the client
    res.json({ message: botResponse });
  });

app.post('/admincode',(req,res)=>{
    if(req.body.admincode==='abc'){
        res.redirect('Studentinfo');
    }else{
        res.redirect('/admincode')
    }
})
app.post('/sendmailstd',(req,res)=>{
    const stdmail=req.body.mailstd
    console.log(stdmail);
    
    StudentInfo.find({}, 'email')
    .then(users => {
        const userEmails = users.map(user => user.email);
        console.log(userEmails);

        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Define email options
        const mailOptions = {
            from: process.env.EMAIL,
            subject: 'Subject of the email',
            text: stdmail
        };

        // Loop through user emails and send emails
        userEmails.forEach(userEmail => {
            mailOptions.to = userEmail;

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${userEmail}:`, error.message);
                } else {
                    console.log(`Email sent to ${userEmail}:`, info.response);
                    res.redirect('/sendmailstd');
                }
            });
        });
    })
    .catch(err => {
        console.error(err);
    });



})
app.post('/paremailsend',(req,res)=>{
    const stdmail=req.body.mailstd
    console.log(stdmail);
    
    StudentInfo.find({}, 'email')
    .then(users => {
        const userEmails = users.map(user => user.email);
        console.log(userEmails);

        // Create a transporter object using SMTP transport
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        // Define email options
        const mailOptions = {
            from: process.env.EMAIL,
            subject: 'Subject of the email',
            text: stdmail
        };

        // Loop through user emails and send emails
        userEmails.forEach(userEmail => {
            mailOptions.to = userEmail;

            // Send the email
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.error(`Error sending email to ${userEmail}:`, error.message);
                } else {
                    console.log(`Email sent to ${userEmail}:`, info.response);
                    res.redirect('/paremailsend');
                }
            });
        });
    })
    .catch(err => {
        console.error(err);
    });



})
   
app.listen(3000, function () {
    console.log("your server is stated on port 3000")
})


  // res.send('<script>alert("This is an alert message");</script>');