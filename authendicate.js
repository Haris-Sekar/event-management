import passport from 'passport';
import passportGoogleOauth2 from 'passport-google-oauth20';
import { userDet } from './app.js';
var GoogleStrategy = passportGoogleOauth2.Strategy;

passport.serializeUser((user, done) => {
    done(null, user.id);
})
var profile1;
passport.deserializeUser((user, done) => {
    done(null, user);
})
var cookieObj = {
  email: "",
  name: "",
}
const callBackurl = "https://eve-mnag.herokuapp.com/auth/google/callback";
const callBackurl1 = "http://localhost:5000/auth/google/callback";
passport.use(new GoogleStrategy({
    clientID:'436514693418-q8inimkodj9qoit8fm8v5kmh94thjh54.apps.googleusercontent.com',
    clientSecret: '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',
    callbackURL: callBackurl,  
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    // profile1 = profile;
    userDet.findOne({email:profile._json.email},(err,docs)=>{
      console.log(docs);

        if(err) console.log(err);
        else{
          cookieObj.email = profile._json.email;
          cookieObj.name = docs.name;
          return done(null, profile);
        }
    })
  }
));
export const cookObj = cookieObj;       
