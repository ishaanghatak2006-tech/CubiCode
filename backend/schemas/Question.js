const mongoose=require('mongoose');

const Question_Schema=new mongoose.Schema({
    owner:{
        type:mongoose.Schema.ObjectId,
        required:true,
    },
    Title:{
        type:String,
        required:true,
    },
    Description:{   
        type:String,
        required:true,
    },
    Difficulty:{
        type:String,
        required:true,
    },
    Funtion_name:{
        type:String,
        required:true,
    },
    Class_name:{
        type:String,
        default:"Solution",
    },
    Visible_tests:[{
        input:{
            type:String,
        },
        Output:{
            type:String,
        },
    }],
    Hidden_tests:[{
        input:{
            type:String,
        },
        Output:{
            type:String,
        },
    }],
    Number_solved:{
        type:Number,
        default:0,
    }
});

export default Question_Schema;