const mongoose=require('mongoose');

const Sub_schema=new mongoose.Schema({
    QuestionId:{
        type:mongoose.Schema.ObjectId,
        required:true,
    },
    language:{
        type:String,
        required:true,
    },
    Code:{
        type:String,
        required:true,
    },
    Verdict:{
        type: String,
        enum: [
        "Accepted",
        "Wrong Answer",
        "Time Limit Exceeded",
        "Runtime Error",
        "Compilation Error"
        ],
        required: true
    },
    Runtime:{
        type:Number,
    },
    Memory:{
        type:Number,
    }
});

export default Sub_schema;