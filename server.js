
const express = require("express");
//const logger = require("morgan");
const mongoose = require("mongoose");
// scrapping tools
const axios = require("axios");
const cheerio = require("cheerio");

//require all exported models
const db = require("./models")

// PORT 
const PORT = process.env.PORT || 3000;

// start express app
const app = express();

// middle wares
const bodyParser = require("body-parser")
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: true }));
// parse application/json
app.use(bodyParser.json());
// Use morgan logger for logging requests
//app.use(logger("dev"));

// make public as static folder
app.use(express.static("public"));

// Set Handlebars.
var exphbs = require("express-handlebars");
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Connect to mongodb 
mongoose.connect("mongodb://localhost/newsScrapperProject",{useNewUrlParser:true});

app.get('/',function(req,res){
  db.Article
    .find({})
    .then(articles => res.render('index', {articles}))
    .catch(err=> res.json(err));
});


//========================Scrape======================================================================//
app.get("/scrape", function(req, res) {
  //check if 
  db.Article.find({})
    .then((savedArticles) => {
      //creating an array of saved article headlines
      let savedHeadlines = savedArticles.map(article => article.headline);
        //check with TAs how to use request instead of axios
        axios.get("https://www.nytimes.com/section/us").then(function(response) {
          // Then, we load that into cheerio and save it to $ for a shorthand selector
          var $ = cheerio.load(response.data);
          let newArticleArr = [];

          //iterating over returned articles, and creating a newArticle object from the data
          $('#latest-panel article.story.theme-summary').each((i, element) => {
            let newArticle = new db.Article({
              storyUrl: $(element).find('.story-body>.story-link').attr('href'),
              headline: $(element).find('h2.headline').text().trim(),
              summary : $(element).find('p.summary').text().trim(),
              imgUrl  : $(element).find('img').attr('src'),
              byLine  : $(element).find('p.byline').text().trim()
            });
            //checking to make sure newArticle contains a storyUrl
            if (newArticle.storyUrl) {
              //checking if new article matches any saved article, if not add it to array
              //of new articles
              if (!savedHeadlines.includes(newArticle.headline)) {
                newArticleArr.push(newArticle);
              }
            }
          });//end of each function

          //adding all new articles to database
          db.Article
            .create(newArticleArr)
            .then(result => res.json({count: newArticleArr.length}))//returning count of new articles to front end
            .catch(err => {});
        })
        .catch(err => console.log(err)); //end of rp method
    })
    .catch(err => console.log(err)); //end of db.Article.find()
});// end of get request to /scrape

//========================find stored articles from mongodb======================================================================//

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function(dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function(err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

app.get('/articles/save/:id', (req,res) => {
  db.Article
    .update({_id: req.params.id},{saved: true})
    .then(result=> res.redirect('/'))
    .catch(err => res.json(err));
});

//get route to render savedArticles.handlebars and populate with saved articles
app.get('/articles/viewSaved', (req, res) => {
  db.Article
    .find({})
    .then(result => res.render('savedArticles', {articles:result}))
    .catch(err => res.json(err));
});

//delete route to remove an article from savedArticles
app.delete('/articles/deleteArticle/:id', function(req,res){
  db.Article
    .remove({_id: req.params.id})
    .then(result => res.json(result))
    .catch(err => res.json(err));
});


//get route to retrieve all notes for a particlular article
app.get('/notes/getNotes/:id', function (req,res){
  db.Article
    .findOne({_id: req.params.id})
    .populate('notes')
    .then(results => res.json(results))
    .catch(err => res.json(err));
});

//get route to return a single note to view it
app.get('/notes/getSingleNote/:id', function (req,res) {
  db.Note
  .findOne({_id: req.params.id})
  .then( result => res.json(result))
  .catch(err => res.json(err));
});

//post route to create a new note in the database
app.post('/notes/createNote', function (req,res){
  let { title, body, articleId } = req.body;
  let note = {
    title,
    body
  };
  db.Note
    .create(note)
    .then( result => {
      db.Article
        .findOneAndUpdate({_id: articleId}, {$push:{notes: result._id}},{new:true})//saving reference to note in corresponding article
        .then( data => res.json(result))
        .catch( err => res.json(err));
    })
    .catch(err => res.json(err));
});

//post route to delete a note
app.post('/notes/deleteNote', (req,res)=>{
  let {articleId, noteId} = req.body;
  db.Note
    .remove({_id: noteId})
    .then(result => res.json(result))
    .catch(err => res.json(err));
});



// Start the server
app.listen(PORT, function() {
  console.log("App running on port " + PORT + "!");
});

























