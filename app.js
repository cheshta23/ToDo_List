const express = require("express");
const bodyParser = require("body-parser");
const date=require(__dirname+"/date.js");
const _=require("lodash");
const mongoose=require("mongoose");
// console.log(date);

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB",{ useNewUrlParser: true, useUnifiedTopology: true })
.then(console.log("connected"));

const itemsSchema=new mongoose.Schema({
    name:String
});
const Item=mongoose.model("Item",itemsSchema);

const item1=new Item({
    name:"Welcome to your todolist!"
});
const item2=new Item({
    name:"Start adding the items "
});

const defaultItems=[item1,item2];

const listSchema={
    name:String,
    items:[itemsSchema]
};

const List=mongoose.model("List",listSchema);

const day=date.getDate();

app.get('/', function (req, res) {
    Item.find().then(function(foundItems){
        if(foundItems.length===0){
            Item.insertMany(defaultItems);
            res.redirect("/");
            
        } else{
            
            res.render("list",{listTitle:day,newListItems:foundItems});
        }
    });
 
});

app.post("/",function(req,res){
    const itemName=req.body.newItem;
    const listName=req.body.list;
    const item=new Item({
        name:itemName
    });

    if((listName)===(day)){ //Home page
        item.save();
        res.redirect("/");
    } else{         //custom list page
        List.findOne({name:listName}).then(function(foundList){
            foundList.items.push(item);
            foundList.save();
            res.redirect("/"+listName);
        });
    }
});

app.post("/delete",function(req,res){
    const checkedItemId=req.body.checkbox;
    const listName=req.body.listName;
    
    if(listName==day){  //Home page
        Item.findByIdAndRemove(checkedItemId).then(console.log("successfully deleted"));
        res.redirect("/");
    } else{             //custom list page
        List.findOneAndUpdate({name:listName},{$pull:{items: {_id:checkedItemId}}}).
        then(res.redirect("/"+listName));
    }

    
});

app.get("/:customListName",function(req,res){
    const customListName=_.capitalize(req.params.customListName);
    List.findOne({name:customListName}).then(function(foundList){
        if(!foundList){         //creating new custom list
            const list= new List({
                name:customListName,
                items: defaultItems
            });
            list.save();
            res.redirect("/"+customListName);
        } else{             //rendering already existing custom list
            res.render("list",{listTitle: foundList.name ,newListItems: foundList.items});
        }
    })
})

app.listen(3000,function(){
    console.log("Server started at port 3000.")
})