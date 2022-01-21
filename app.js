import express from 'express';
import mongoose from 'mongoose';
import bodyParser from "body-parser";
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import cookieParser from 'cookie-parser';
import passport from 'passport';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import nodemailer from 'nodemailer';
import xl from 'excel4node';
import XLSX from 'xlsx';
const saltRounds = 10;
const app = express();
app.use(cookieParser());
dotenv.config();
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));
app.use('/docs',express.static(path.join(__dirname,'docs')));
 const userDetailsSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: Object,
});
export const userDet = mongoose.model("userDetails",userDetailsSchema);
const adminDet = new mongoose.Schema({
    intitutionName: String,
    email: String,
    phone: Number,
    password: String,
});
const adminDetails = mongoose.model("admindetails",adminDet);

var adminEmail;
var cookieObjAdmin = {
    email: "",
    name: "",
}
var cookieObj = {
    email: "",
    name: "",
}
app.get('/adminLogin',(req,res)=>{
     res.render('admin/adminLogin',{code: cookieObjAdmin});
});
app.post('/adminLogin',(req,res)=>{
    adminDetails.findOne({email: req.body.email},(err,user)=>{
        if(err) console.log(err);
        adminEmail = req.body.email;

        bcrypt.compare(req.body.password, user.password).then(function(result) {
            if(result===true){
                cookieObjAdmin.email=adminEmail;
                cookieObjAdmin.name=user.intitutionName;
                res.cookie("userDataAdmin",cookieObjAdmin,{ maxAge: 2 * 60 * 60 * 1000, httpOnly: true });
                res.redirect("/admin");
            }
                else{
                    cookieObjAdmin.code=false;
                    res.redirect('/adminLogin');
                }
        });
    });
})

app.get('/',(req,res)=>{
    res.render('login',{err: 'none'});


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
        if(err) console.log(err);
        else if(!user) res.render('login',{err: "failed"})
        else { 
            name = user.name;
            email = req.body.email;
            bcrypt.compare(req.body.password, user.password).then(function(result) {
                if(result===true){
                    process.env.isLoged = "true";   
                    cookieObj.email=email;
                    cookieObj.name=name;
                    res.cookie("userData",cookieObj,{ maxAge: 2 * 60 * 60 * 1000, httpOnly: true });
                    res.redirect("/home");

                }
                    else{
                        cookieObj.code=false;
                        res.render('login',{err : "failed"});
                    }
            });
        }
    });
});
import './authendicate.js';
import {cookObj} from './authendicate.js';

app.get('/google',passport.authenticate('google',{scope: ['profile','email']}));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/loginGoogleFailed' }), (req, res) => {
    //res.redirect('/');
    // console.log(profile);
    console.log(cookObj);
    res.cookie("userData",cookObj,{ maxAge: 2 * 60 * 60 * 1000, httpOnly: true });
    // res.end('Logged in!');
    res.redirect('/home');
  });
  app.get('/loginGoogleFailed',(req,res)=>{
      res.render('login',{err: "failed"});
  })
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

app.get('/home',(req,res)=>{



    if(!req.cookies.userData) res.redirect("/");
    else{
        Event.find((err,data)=>{
            if(err) console.log(err);
            res.render('index',{name: req.cookies.userData.name,Events: data});
        })

    }
});



app.post("/addEvent",async(req,res)=>{
    if(!req.cookies.userDataAdmin) res.redirect("/adminLogin");

    const v1 = new Event({
        adminEmail:req.cookies.userDataAdmin.email,
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
    phone: String,
    rollNumber: String

});

const EventReg = mongoose.model("EventRegistrationDetails",addEventReg);


app.get('/admin',async (req,res)=>{
    if(!req.cookies.userDataAdmin) res.redirect("/adminLogin");

    var EventDatas={
        events: 0,
        ongoing: 0,
        Upcomming: 0,
        completed: 0,
    }
    Event.find({adminEmail: req.cookies.userDataAdmin.name},(err, docs) => {
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

            res.render('admin/admin',{adminEmail: req.cookies.userDataAdmin.name,EventData: EventDatas});

        } else {
            console.log('Failed to retrieve the Course List: ' + err);
        }
    });

});
app.get("/allEvents",(req,res)=>{
    if(!req.cookies.userData) res.redirect("/");

    Event.find((err,docs)=>{
        if(err) console.log(err);
        else if(docs.length===0) res.render('allEvents',{name: req.cookies.userData.name,eve: "no Events"});

        else{
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                if(err) console.log(err);
                else{
                    // console.log(data);
                }            
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    console.log(docs[0].id);
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    // console.log(arr);
                    // console.log(docs);
                    res.render('allEvents',{name: req.cookies.userData.name,EventData: docs,registerEvents: data,arr:arr,eve:""});
                })
            })
        }
    })
    
})
app.get('/logout',(req,res)=>{
    process.env.isLoged = "false";
    res.clearCookie('userData');
    res.redirect('/');
})
app.get('/adminLogout',(req,res)=>{
    process.env.isAdminLoged = "false";
    res.clearCookie('userDataAdmin');
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
    if(!req.cookies.userData) res.redirect("/");

    Event.find((err,docs)=>{
        if(err) console.log(err);
        else if(docs.length==0) res.render('upcomingEvents',{name: req.cookies.userData.name,eve:"no Events"});
        else{
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                if(err) console.log(err);
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    // console.log(docs[0].id);
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    // console.log(docs);
                    res.render('upcomingEvents',{name: req.cookies.userData.name,EventData: docs,registerEvents: data,arr:arr,eve:""});
                })
            })
        }
    })
})

app.get("/liveEvents",(req,res)=>{
    if(!req.cookies.userData) res.redirect("/");

    Event.find((err,docs)=>{
        

        if(err) console.log(err);
        else if(docs.length===0) res.render('liveEvents',{name: req.cookies.userData.name,eve: "no Events"});

        else{
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    // console.log(docs);
                    res.render('liveEvents',{name: req.cookies.userData.name,EventData: docs,registerEvents: data,arr:arr,eve:""});
                })

            })
        }
    })
})

app.get("/endedEvents",(req,res)=>{
    if(!req.cookies.userData) res.redirect("/");

    Event.find((err,docs)=>{
        if(err) console.log(err);
        else if(docs.length===0) res.render('endedEvent',{name: req.cookies.userData.name,eve: "no Events"});

        else{
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    console.log(docs[0].id);
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    // console.log(docs);
                    res.render('endedEvent',{name: req.cookies.userData.name,EventData: docs,registerEvents: data,arr:arr,eve:""});
                })

            })
        }
    })
});


app.get('/regEvents',(req,res)=>{
    if(!req.cookies.userData) res.redirect("/");

    Event.find((err,docs)=>{
        if(err) console.log(err);
        else if(docs.length===0) res.render('regEvents',{name: req.cookies.userData.name,eve: "no Events"});

        else{
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    console.log(docs[0].id);
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    // console.log(docs);
                    res.render('regEvents',{name: req.cookies.userData.name,EventData: docs,registerEvents: data,arr:arr,eve:""});
                })
            })
        }
    })
});

app.get('/catEve',(req,res)=>{
    if(!req.cookies.userData) res.redirect("/");

    Event.find({categories:req.query.name},(err,docs)=>{
        if(err) console.log(err);
        else if(docs.length===0) res.render('categories_events',{name: req.cookies.userData.name,eve: "no Events",categorie: req.query.name});

        else if(docs.length>0){
            EventReg.find({email : req.cookies.userData.email},(err,data)=>{
                EventReg.find((err,evenRegData)=>{
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
                    var arr=[];
                    console.log(docs[0].id);
                    for(var i=0;i<docs.length;i++){
                        var temp = evenRegData.filter((item)=>{
                            return item.eventID ===docs[i].id ;
                        });
                        // console.log(temp.length);
                        var temp1= {
                            id: docs[i].id,
                            reg: temp.length,
                        }
                        // arr[docs[i].id] = temp.length;
                        arr.push(temp1);
                    }
                    res.render('categories_events',{name: req.cookies.userData.name,EventData: docs,categorie: req.query.name,arr:arr,eve:""});
                })

            })
        }
        else{
            res.render('categories_events',{name: req.cookies.userData.name,EventData: docs,categorie: req.query.name,eve:""});
        }
    })
})


app.get('/adminEvents',(req,res)=>{
    if(!req.cookies.userDataAdmin) res.redirect("admin/adminLogin");

    
    Event.find({adminEmail: req.cookies.userDataAdmin.name},(err,data)=>{

        if(err) console.log(err);
        else if(data.length===0) res.render('admin/yourEvents',{adminEmail:req.cookies.userDataAdmin.name,eve: "no Events"});

        else{
            res.render('admin/yourEvents',{adminEmail:req.cookies.userDataAdmin.name,EventData: data,eve:""});
        }
    })
})
app.get('/adminReg',(req,res)=>{

    res.render('admin/adminReg');
})
app.post('/adminSignup',(req,res)=>{
    bcrypt.hash(req.body.password, 10, function(err, hash) {
        const signupVal = new adminDetails({
            intitutionName: req.body.name,
            email: req.body.email,
            phone: req.body.mob,
            password: hash,
        });
        signupVal.save();
        res.redirect('/');
    });
})
app.post('/deleteEvent',(req,res)=>{

    console.log(req.body);
    Event.deleteOne({id: req.body.id},(err,data)=>{
        if(err) console.log(err);
        else{
            res.redirect('/adminEvents');
        }
    })
});
app.get('/EventRegDet',(req,res)=>{
    if(!req.cookies.userDataAdmin) res.redirect("/");

    // console.log(req.query.id);
    EventReg.find({eventID:req.query.id},(err,data)=>{
        if(err) console.log(err);
        else{
            // console.log(data);
            var regDet=[];
            for(var i=0;i<data.length;i++){
                var temp={
                    name: data[i].name,
                    email: data[i].email,
                    phone: data[i].phone,
                    rollNumber: data[i].rollNumber,
                }
                regDet.push(temp);

            }
            console.log(regDet);
            const wb = new xl.Workbook();
            const ws = wb.addWorksheet("EVENTdet");
            const colName = [
                "name",
                "email",
                "phone",
                "rollNumber"
            ];
            let headingColumnIndex = 1;
            colName.forEach(heading => {
                ws.cell(1, headingColumnIndex++)
                    .string(heading)
            });
            let rowIndex = 2;
            regDet.forEach( record => {
                let columnIndex = 1;
                Object.keys(record ).forEach(columnName =>{
                    ws.cell(rowIndex,columnIndex++)
                        .string(record[columnName])
                });
                rowIndex++;
            });
            
            var filePath = "https://eve-mnag.herokuapp.com/docs/"+req.query.id+".xlsx";
            wb.write('docs/'+req.query.id+'.xlsx');
            // console.log(filePath);
            res.render('admin/EventRegDet',{adminEmail:req.cookies.userDataAdmin.name ,regDet:regDet,path: filePath});
        }        
    })
})
app.post('/exportdata',(req,res)=>{
    var wb = XLSX.utils.book_new(); //new workbook
    EventReg.find((err,data)=>{
        if(err){
            console.log(err)
        }else{
            var temp = JSON.stringify(data);
            temp = JSON.parse(temp);
            var ws = XLSX.utils.json_to_sheet(temp);
            var down = __dirname+'/public/exportdata.xlsx'
           XLSX.utils.book_append_sheet(wb,ws,"sheet1");
           XLSX.writeFile(wb,down);
           res.download(down);
        }
    });
});
const port = process.env.PORT || 5000;
mongoose.connect(process.env.URL, {useNewUrlParser : true, useUnifiedTopology: true})
    .then( () => app.listen(port, () => console.log(`Serve running on port ${port}`)))
    .catch((error)=>console.log(error));