const mongoose=require('mongoose');

const UserSchema=new Schema({
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
            type:Schema.ObjectId,
        }
    }],
    Questions_created:[{
        created:{
            type:Schema.ObjectId,
        }
    }],
    Submissions:[{
        user_sub:{
            type:mongoose.Schema.ObjectId,
        }
    }]  
});

export default UserSchema;