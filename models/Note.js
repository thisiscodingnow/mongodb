const mongoose = require("mongoose");

//reference to the Schema constructor
const Schema =mongoose.Schema;

//create a new NoteSchema object from schema constructor.
const noteSchema = new Schema({
    title:String,
    body:String

});

// create the actual Note model 
const Note = mongoose.model("Note",noteSchema);

// export model so that could be used in other files
module.exports = Note;
