const Question_Schema=require('..schemas/Question.js');
const mongoose=require('mongoose');
const express=require("express");
const route=express.Router;

route.post('/Create_question', async(req,res)=>{
    try{

    }
    catch(err){
        const error=" Error Creating Question"+err.message;
        res.status(500).json({error:error});
    }        
})

