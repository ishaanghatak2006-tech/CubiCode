const express=require('express');
const mongoose=require('mongoose');
const Users=require('../schemas/User');
const Question=require('../schemas/Question')
const { listen } = require('node:quic');
const router=express.Router();

//make a trie structure
class queue{
    constructor(){
        this.frontNode=null;
        this.lastNode=null;
        this.length=0;
    }
    push(item){
        const newNode={
            value:item,
            next:null
        };

        if(this.empty()){
            this.frontNode=newNode;
            this.lastNode=newNode;
        }
        else{
            this.lastNode.next=newNode;
            this.lastNode=newNode;
        }
        this.length++;
    }
    pop(){
        if(this.empty()){
            return null;
        }

        const poppedValue=this.frontNode.value;
        this.frontNode=this.frontNode.next;
        this.length--;

        if(this.empty()){
            this.lastNode=null;
        }

        return poppedValue;
    }
    front(){
        if(this.empty()){
            return null;
        }
        return this.frontNode.value;
    }
    empty(){
        return this.length===0;
    }
    size(){
        return this.length;
    }
};
class TrieNode{
    constructor(){
        this.children={};
        this.end=false;
        this.word=null;
    }
};
class Trie{
    constructor(){
        this.root=new TrieNode();
    }
    insert(word){
        if(!word){
            return;
        }

        let node=this.root;
        const originalWord=word;
        word=word.toLowerCase();

        for(const ch of word){
            if(!node.children[ch]){
                node.children[ch]=new TrieNode();
            }
            node=node.children[ch];//move into the characters node....
        }
        node.end=true;//when a word ends
        node.word=originalWord;
    }
    bfs(node,s,list,count){
        //get a queue ans sttrre the current node and then navigate level by level 
        let q=new queue();
        q.push({
            node:node,
            word:s,
        });
        while(!q.empty()){
            let current=q.pop();
            if(current.node.end){
                list.push(current.node.word || current.word);
                count++;
                if(count>=10){
                    break;
                }
            }
            for(const [ch,child] of Object.entries(current.node.children)){
                q.push({
                    node:child,
                    word:current.word+ch,
                })
            }
        }
        return list;
    }
    find(word){
        let node=this.root;
        let s="";
        let list=[];
        let count=0;
        word=(word || "").toLowerCase();

        for(const ch of word){
            s+=ch;
            if(!node.children[ch]){
                return list;
            }
            node=node.children[ch];
        }

        return this.bfs(node,s,list,count);
    }
};

const usernameTrie=new Trie();
const questionTrie=new Trie();

router.get('/loadAll',async(req,res)=>{
    try{
        //load all the users and questions from the database when its loaded
        const users=await Users.find({}).select("Username");
        const questions=await Question.find({}).select("Title");

        usernameTrie.root=new TrieNode();
        questionTrie.root=new TrieNode();

        for(const user of users){
            usernameTrie.insert(user.Username);
        }

        for(const question of questions){
            questionTrie.insert(question.Title);
        }

        res.status(200).json({message:"user and question data read into trie for autocomplete"});
    }
    catch(err){
        res.status(400).json({message:"Error reading autocomplete data...",error:err.message});
    }
});
router.get('/loadUsers',async(req,res)=>{
    try{
        const users=await Users.find({}).select("Username");
        usernameTrie.root=new TrieNode();

        for(const user of users){
            usernameTrie.insert(user.Username);
        }

        res.status(200).json({message:"user data read into trie for autocomplete"});
    }
    catch(err){
        res.status(400).json({message:"Error reading user data...",error:err.message});
    }
});
router.get('/loadQuestions',async(req,res)=>{
    try{
        const questions=await Question.find({}).select("Title");
        questionTrie.root=new TrieNode();

        for(const question of questions){
            questionTrie.insert(question.Title);
        }

        res.status(200).json({message:"question data read into trie for autocomplete"});
    }
    catch(err){
        res.status(400).json({message:"Error reading question data...",error:err.message});
    }
});
router.get('/findUsername',async(req,res)=>{
    try{
        const search=req.query.search || req.query.username || req.query.q || "";
        const recommendations=usernameTrie.find(search);

        res.status(200).json({recommendations});
    }
    catch(err){
        res.status(400).json({message:"Error finding username recommendations...",error:err.message});
    }
});
router.get('/findQuestion',async(req,res)=>{
    try{
        const search=req.query.search || req.query.title || req.query.q || "";
        const recommendations=questionTrie.find(search);

        res.status(200).json({recommendations});
    }
    catch(err){
        res.status(400).json({message:"Error finding question recommendations...",error:err.message});
    }
});

module.exports=router;
