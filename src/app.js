const express = require("express");
const bodyParser = require("body-parser");
const mongoClient = require("mongodb").MongoClient;
const imdb = require("./imdb");
const graphqlHTTP = require('express-graphql');
const {
    GraphQLSchema,
    GraphQLObjectType,
    GraphQLString,
    GraphQLInt
} = require('graphql');

const DENZEL_IMDB_ID = "nm0000243";
const CONNECTION_URL = "mongodb://localhost/test";
const DATABASE_NAME = "denzel";
const PORT = 9292;
const METASCORE = 70;

const app = express();

app.use(bodyParser.urlencoded());
app.use(bodyParser.json());

let database, collection;

// Functions
// Populate the database
async function populateMovies(callback) {
    console.log(`📽️  fetching filmography of ${DENZEL_IMDB_ID}...`);
    const movies = await imdb(DENZEL_IMDB_ID);
    collection.insertMany(movies, callback);
}

// Fetch a random must-watch movie
async function randomMovie(callback) {
    console.log(`📽️  fetching random must-watch movie...`);
    database.collection("movies")
        .aggregate([
            {$match: {"metascore": {"$gt": METASCORE}}},
            {$sample: {size: 1}}
        ])
        .toArray(callback);
}

// Fetch a specific movie
async function specificMovie(callback) {
}

// Search for Denzel's movies
async function searchMovie(callback) {
}

// Save a watched date and a review
async function reviewMovie(callback) {
}


// REST
// Populate the database
app.get("/movies/populate", (request, response) => {
    populateMovies((error, result) => {
        try {
            if (error) {
                throw error;
            }
            response.send(result.result);
        } catch
            (e) {
            console.error(e);
            process.exit(1);
        }
    })
});

// Fetch a random must-watch movie
app.get("/movies", (request, response) => {
    randomMovie((error, result) => {
        try {
            if (error) {
                throw error;
            }
            response.send(awesome);
        } catch (e) {
            console.error(e);
            process.exit(1);
        }
    });
});

// Fetch a specific movie
app.get("/movies/:id(tt\\d+)", (request, response) => {
    try {
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
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});

// Search for Denzel"s movies
app.get("/movies/search", (request, response) => {
    try {
        console.log(`📽️  fetching Denzel"s movies...`);
        let metascore = request.query.metascore || 0;
        let limit = request.query.limit || 5;
        try {
            limit = parseInt(limit)
        } catch (e) {
            limit = 5;
        }
        try {
            metascore = parseInt(metascore)
        } catch (e) {
            metascore = 0;
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
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});

// Save a watched date and a review
app.post("/movies/:id", (request, response) => {
    try {
        console.log(`📽️  saving review...`);
        console.log(request.body);
        database.collection("movies").findOneAndUpdate(
            {"id": request.params.id},
            {$push: {"reviews": {"date": request.body.date, "review": request.body.review}}}
        );
        response.send({"ok": true});
        console.log(`review saved`);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
});


//GraphQL
// Define Movie Type
movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        link: {type: GraphQLString},
        metascore: {type: GraphQLInt},
        synopsis: {type: GraphQLString},
        title: {type: GraphQLString},
        year: {type: GraphQLInt}
    }
});

// Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        // Populate the database
        populate: {
            resolve: function (source, args, context) {
                populateMovies(source, context);
            }
        },

        // Fetch a random must-watch movie
        random: {
            type: movieType,
            resolve: function (source, args) {
                return "Hello World";
            }
        },

        // Fetch a specific movie
        specific: {
            type: movieType,
            args: {
                id: {type: GraphQLInt}
            },
            resolve: function (request, args, context) {
                return "Hello World";
            }
        },

        // Search for Denzel's movies
        search: {
            type: movieType,
            args: {
                id: {type: GraphQLInt}
            },
            resolve: function (source, args) {
                return "Hello World";
            }
        },

        // Save a watched date and a review
        review: {
            type: movieType,
            args: {
                id: {type: GraphQLInt}
            },
            resolve: function (source, args) {
                return "Hello World";
            }

        }
    }
});

// Define the Schema
const schema = new GraphQLSchema({
    query: queryType
});

mongoClient.connect(CONNECTION_URL, {useNewUrlParser: true}, (error, client) => {
    if (error) {
        throw error;
    }
    database = client.db(DATABASE_NAME);
    collection = database.collection("movies");
    console.log("Connected to `" + DATABASE_NAME + "`!");

    app.use('/graphql', graphqlHTTP({
        schema: schema,
        context: {collection},
        graphiql: true,
    }));

    app.listen(PORT);
});
