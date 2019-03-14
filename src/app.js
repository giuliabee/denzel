const express = require("express");
const bodyParser = require("body-parser");
const mongoClient = require("mongodb").MongoClient;
const objectId = require("mongodb").ObjectID;
const imdb = require("./imdb");

const DENZEL_IMDB_ID = "nm0000243";
const CONNECTION_URL = "mongodb://localhost/test";
const DATABASE_NAME = "denzel";
const PORT = 9292;
const METASCORE = 70;

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

let database, collection;

app.listen(PORT, () => {
    mongoClient.connect(CONNECTION_URL, {useNewUrlParser: true}, (error, client) => {
        if (error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("movies");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

// Populate the database with all the Denzel"s movies from IMDb
app.get("/movies/populate", (request, response) => {
    populateMovies(request, response);
});

async function populateMovies(request, response) {
    try {
        console.log(`📽️  fetching filmography of ${DENZEL_IMDB_ID}...`);
        const movies = await imdb(DENZEL_IMDB_ID);
        collection.insertMany(movies, (error, result) => {
            if (error) {
                return response.status(500).send(error);
            }
            response.send(result.result);
        });
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

// Fetch a random must-watch movie
app.get("/movies", (request, response) => {
    console.log(`📽️  fetching random must-watch movie...`);
    database.collection("movies")
        .aggregate([
            {$match: {"metascore": {"$gt": METASCORE}}},
            {$sample: {size: 1}}
        ])
        .toArray(function (error, awesome) {
            if (error) {
                throw error;
            }
            response.send(awesome);
        });
});


// Fetch a specific movie
app.get("/movies/:id(tt\\d+)", (request, response) => {
    console.log(`📽️  fetching movie ${request.params.id}...`);
    database.collection("movies")
        .aggregate([
            {$match: {"id": request.params.id}}
        ])
        .toArray(function (error, movie) {
            if (error) {
                throw error;
            }
            response.send(movie);
        });
});

// Search for Denzel"s movies
app.get("/movies/search", (request, response) => {
    console.log(`📽️  fetching Denzel"s movies...`);
    let metascore = request.query.metascore || 0;
    let limit = request.query.limit || 5;
    try {
        limit = parseInt(limit)
    } catch (e) {
        limit = 5;
    }
    database.collection("movies")
        .aggregate([
            {$match: {"metascore": {"$gt": metascore}}},
            {$limit: limit}
        ])
        .toArray(function (error, movies) {
            if (error) {
                throw error;
            }
            response.send(movies);
        });
});

// Save a watched date and a review
app.post("/movies/:id", (request, response) => {
    console.log(`📽️  saving review...`);
    console.log(request.body);
    database.collection("movies").findOneAndUpdate(
        {"id": request.params.id},
        {$push: {"reviews": {"date": request.body.date, "review": request.body.review}}}
    );
    response.send({"ok": true});
    console.log(`review saved`);
});
