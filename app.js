import express from 'express';
import mongoose from 'mongoose';
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import nodemailer from 'nodemailer';
const saltRounds = 10;
const app = express();
dotenv.config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));

const userDetailsSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: Object,
});
const userDet = mongoose.model("userDetails",userDetailsSchema);
const adminDet = new mongoose.Schema({
    email: String,
    password: String,
});
const adminDetails = mongoose.model("admindetails",adminDet);
app.get('/adminLogin',(req,res)=>{
    res.render('admin/adminLogin');
});
var adminEmail;
app.post('/adminLogin',(req,res)=>{
    adminDetails.findOne({email: req.body.email},(err,user)=>{
        adminEmail = req.body.email;
        bcrypt.compare(req.body.password, user.password).then(function(result) {
            if(result===true){
                process.env.isAdminLoged = "true";   
                res.redirect("/admin");
            }
                else{
                    
                }
        });
    });
})

app.get('/',(req,res)=>{
    res.render('login');


});
app.post('/signup',(req,res)=>{
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        const signupVal = new userDet({
            name: req.body.name,
            email: req.body.email,
            password: hash
        });
        signupVal.save();
        res.redirect('/');
    });
    
})
var name;
var email;
app.post('/',(req,res)=>{
    userDet.findOne({email: req.body.email},(err,user)=>{
        name = user.name;
        email = req.body.email;
        bcrypt.compare(req.body.password, user.password).then(function(result) {
            if(result===true){
                process.env.isLoged = "true";   
                res.redirect("/home");
            }
                else{
                    
                }
        });
    });
})
app.get('/home',(req,res)=>{
    if(process.env.isLoged != "true") res.redirect("/");
    else res.render('index',{name: name})
});


app.use(express.static("public"));
const addEventSchema = new mongoose.Schema({
    adminEmail: String,
    eventName: String,
    eventDec: String,
    eventCat: String,
    eventStartDate: Date,
    eventEndDate: Date,
    regStartDate: Date,
    regEndDate: Date,
    collegeName: String,
    categories: String,
    city: String,
    state: String,
    zip: Number,
    modeOfEvent: String,
    registered: String,
});
const Event = mongoose.model("Event",addEventSchema);

app.post("/addEvent",async(req,res)=>{
    const v1 = new Event({
        adminEmail:adminEmail,
        eventName: req.body.eventName,
        eventDec: req.body.eventDec,
        eventCat:req.body.eventCat,
        eventStartDate: req.body.eventStartDate,
        eventEndDate: req.body.eventEndDate,
        regStartDate: req.body.regStartDate,
        regEndDate: req.body.regEndDate,
        collegeName: req.body.clgName,
        categories: req.body.categories,
        city: req.body.city,
        state: req.body.state,
        zip: req.body.zip,
        modeOfEvent: req.body.modeOfEvent
    });
    await v1.save();

    res.redirect('/admin');
})


const addEventReg = new mongoose.Schema({
    eventID: String,
    name: String,
    email: String,
    phone: Number,
    rollNumber: String

});

const EventReg = mongoose.model("EventRegistrationDetails",addEventReg);


app.get('/admin',async (req,res)=>{
    var EventDatas={
        events: 0,
        ongoing: 0,
        Upcomming: 0,
        completed: 0,
    }
    Event.find((err, docs) => {
        if (!err) {
            for(var i=0;i<docs.length;i++){
            EventDatas.events=docs.length;
            const today = new Date().getTime();
            const eventStartDate=docs[i].eventStartDate.getTime();
            const eventEndDate=docs[i].eventEndDate.getTime();
                
                if(eventStartDate < today && eventEndDate > today){
                    const temp = EventDatas.ongoing;
                    EventDatas.ongoing= temp+1;
                }
                else if(eventStartDate > today){
                    const temp = EventDatas.Upcomming;
                    EventDatas.Upcomming = temp+1;
                }else if(eventEndDate<today){
                    const temp = EventDatas.completed;
                    EventDatas.completed = temp+1;
                }
                
            }

            res.render('admin/admin',{adminEmail: adminEmail,EventData: EventDatas});

        } else {
            console.log('Failed to retrieve the Course List: ' + err);
        }
    });

});
app.get("/allEvents",(req,res)=>{
    Event.find((err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);
                else{
                    // console.log(data);
                }            
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                // console.log(docs);
                res.render('allEvents',{name: name,EventData: docs,registerEvents: data});

            })
        }
    })
    
})
app.get('/logout',(req,res)=>{
    process.env.isLoged = "false";
    res.redirect('/');
})
app.get('/adminLogout',(req,res)=>{
    process.env.isAdminLoged = "false";
    res.redirect('/adminLogin');
})


app.post('/eventReg',(req,res)=>{
    const EventRegDetails = new EventReg({
        eventID: req.body.eventId,
        name: req.body.name,
        email: req.body.email,
        phone: req.body.phone,
        rollNumber: req.body.roll,
    });
    EventRegDetails.save();

    res.redirect('/home');
})


app.get("/upcomingEvent",(req,res)=>{
    Event.find((err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);
                else{
                    // console.log(data);
                }            
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                // console.log(docs);
                res.render('upcomingEvents',{name: name,EventData: docs,registerEvents: data});

            })
        }
    })
})

app.get("/liveEvents",(req,res)=>{
    Event.find((err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                // console.log(docs);
                res.render('liveEvents',{name: name,EventData: docs,registerEvents: data});

            })
        }
    })
})

app.get("/endedEvents",(req,res)=>{
    Event.find((err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);            
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                // console.log(docs);
                res.render('endedEvent',{name: name,EventData: docs,registerEvents: data});
            })
        }
    })
});


app.get('/regEvents',(req,res)=>{
    Event.find((err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);            
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                // console.log(docs);
                res.render('regEvents',{name: name,EventData: docs,registerEvents: data});
            })
        }
    })
});

app.get('/catEve',(req,res)=>{
    Event.find({categories:req.query.name},(err,docs)=>{
        if(err) console.log(err);
        else{
            EventReg.find({email : email},(err,data)=>{
                if(err) console.log(err);
                else{
                    // console.log(data);
                }            
                for(let i=0;i<docs.length;i++){
                    for(let j=0;j<data.length;j++){
                        if(docs[i].id === data[j].eventID) {
                            docs[i].registered = "true";
                        }
                        else{
                            continue;
                        }
                    }
                }
                res.render('categories_events',{name: name,EventData: docs,categorie: req.query.name});

            })
        }
    })
})


app.get('/adminEvents',(req,res)=>{
    
    Event.find({adminEmail: adminEmail},(err,data)=>{
        if(err) console.log(err);
        else{
            res.render('admin/yourEvents',{adminEmail:adminEmail,EventData: data});
        }
    })
})

app.post
const port = 5000 || process.env.PORT;
mongoose.connect(process.env.URL, {useNewUrlParser : true, useUnifiedTopology: true})
    .then( () => app.listen(port, () => console.log(`Serve running on port ${port}`)))
    .catch((error)=>console.log(error));