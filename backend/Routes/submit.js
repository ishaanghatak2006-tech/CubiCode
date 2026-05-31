const mongoose=require('mongoose');
const express=require('express');
const route=express.Router();
const users=require('../schemas/User');
const Question=require('../schemas/Question');
const sub=require('../schemas/submission');
const axios=require('axios');

async function runpiston(lang,code,input){
    const response= await axios.post(
        "https://emkc.org/api/v2/piston/execute",{
            language:lang,
            source:code,
            stdin:input,
        }
    );
    return response.data;
}

function generateWrappedCode(lang, userCode, question) {
  if (lang === "cpp") return generateCppCode(userCode, question);
  if (lang === "python") return generatePythonCode(userCode, question);
  if (lang === "java") return generateJavaCode(userCode, question);
}

route.post('/submit_soln/:id',async(req,res)=>{
    try{
        const quest_id=req.params.id;
        const question=await Question.findById(quest_id);
        const {userid,lang,code}=req.body; //the userid,languade,and code is recieved from the backedn....
        const wrappedCode=generateWrappedCode(lang,code,question);

        //now we have to pass the code to piston
        let count=0;
        let Verdict="Accepted";
        let maxruntime=0;
        const total=question.Hidden_tests.length;

        for(let i=0;i<total;i++){
            const test_case=question.Hidden_tests[i];
            const expected=test_case.output.trim();    
            //now pass test_case.input in the function
            const result=await runpiston(lang,wrappedCode,test_case.input);

            const time=result.run?.time;
            if(time && time>maxruntime){
                maxruntime=time;
            }

            if(result.compile?.stderr){        //stderr:standard error
                Verdict="Compilation Error";
                break;
            }
            if(result.run.stderr){
                Verdict="Runtime Error";
                break;
            }

            const output=result.run.stdout.trim();  //stdout:standard output...
            if(output!=expected){
                Verdict="Wrong Answer";
                break;
            }

            count++;

        }

        //now we have the number of test cases passed and the Verdict n untime too....
        
        const user_sub=new sub({
            QuestionId:quest_id,
            UserId:userid,
            language:lang,
            Code:code,
            Verdict:Verdict,
            Runtime:maxruntime,
            Passed:count,
        })

        await user_sub.save();
        res.status(200).json({
            message:"solution judged successfully",
            submitted:user_sub,
        });
    }catch(err){
        console.log(err.message);
        res.status(400).json({message:"can't submit solution,please try again!"});
    }
});

module.exports=route;