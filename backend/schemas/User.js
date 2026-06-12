const mongoose=require('mongoose');
const Question = require('./Question');
const Submission=require('./Submission');
const bcrypt = require("bcrypt");

const UserSchema=new mongoose.Schema({
    Role:{
        type:String,
        enum:["user","admin"],
        default:"user"
    },
    Username:{
        type:String,
        required:true,
        unique:true,
    },
    Email:{
        type:String,
        required:true,
        unique:true
    },
    Password:{
        type:String,
        required:true,
        select:false,
    },
    DateCreated:{
        type:Date,
        default:Date.now,
    },
    Solved_questions:{
        type:Number,
        default:0,
    },
    Questions_solved:[{
        solved:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Question",
        }
    }],
    Questions_created:[{
        created:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Question",
        }
    }],
    Submissions:[{
        user_sub:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Submission",
        }
    }]  
});

//hash paswwords before its is saved....
UserSchema.pre("save", async function () {
    if (!this.isModified("Password")) {
        return;
    }

    const salt = await bcrypt.genSalt(10);
    this.Password = await bcrypt.hash(this.Password, salt);
});

UserSchema.methods.comparePassword = async function(candidatePassword){

    return await bcrypt.compare(
        candidatePassword,
        this.Password
    );
};


module.exports =
  mongoose.models.User ||
  mongoose.model("User", UserSchema);
