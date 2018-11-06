const mongoose = require("mongoose");

//reference to the Schema constructor
const Schema =mongoose.Schema;

//create a new ArticleSchema object from schema constructor.
const ArticleSchema = new Schema({
   headline:{
       type:String,
       unique:true
   },
   summary:{
       type:String
       //required:true
   },
   storyUrl: String,
   imgUrl: String,
   byLine: String,
   saved: {
     type: Boolean,
     default: false
   },
   
    //populate the Article with an associated note*/
  notes:[
      {
      type:Schema.Types.ObjectId, 
      ref:"Note"
  }
]   

})

// create Artuckemodel using above schema
const Article = mongoose.model("Article",ArticleSchema);

module.exports = Article;

