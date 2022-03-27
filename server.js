require('dotenv').config();
const express = require('express');
const cors = require('cors');
const app = express();
const {nanoid} = require('nanoid');
const  validUrl = require('valid-url');
// Basic Configuration
const port = process.env.PORT || 3000;

app.use(cors());

app.use('/public', express.static(`${process.cwd()}/public`));

app.get('/', function(req, res) {
  res.sendFile(process.cwd() + '/views/index.html');
});

// Database setup
const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI)

const {Schema} = mongoose;

const urlSchema = new Schema({
  original_url: String,
  short_url: String
})

let UrlModel = mongoose.model("URLs", urlSchema)

const createAndSaveUrl = async (original_url, short_url, done) => {
  const urlShortened = new UrlModel({
    original_url, 
    short_url
  })
  await urlShortened.save(function(err, data) {
    if(err) return console.log(err)
    done(data)
  })
}
const findShortUrl = async (short_url, done) => {
  await UrlModel.findOne({short_url}, function(err, data){
    if(err) return res.status(401).json({url: "Invalid Shortened Url"})
    done(data)
  })
}
//First API endpoint
app.use(express.urlencoded({extended: false}))
app.get('/api/hello', function(req, res) {
  res.json({ greeting: 'hello API' });
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});

app.post('/api/shorturl', async function(req, res) {
  const original_url = req.body.url
  const short_url = await nanoid(7)
  
  if(!validUrl.isWebUri(original_url)) {
    console.log(original_url)
    return res.json({error: 'invalid url'})
  }
  await createAndSaveUrl(original_url, short_url, function(data){
    const {original_url, short_url} = data
    res.status(200).json({original_url, short_url})
  }).catch(e => console.log(e))
})

app.get('/api/shorturl/:short_url?', async function(req, response) {
  UrlModel.findOne(req.params, function(err, data){
    const {original_url} = data
    response.redirect(original_url)
  })
})